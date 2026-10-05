import { test } from "node:test";
import assert from "node:assert/strict";

/**
 * P3 — authoring domain, DB-free.
 *
 * Pure unit tests for the catalog logic that backs the authoring routes
 * (plan §6): answer state machine (T2), phase lock/unlock + dependency
 * invalidation (T3), generation gate (T4), idempotency keys (T5), import
 * review-before-accept (T8), template progress, and file sniffing. No Prisma,
 * no I/O — everything is a deterministic function of (template, answers).
 */
import {
  TEMPLATES,
  buildGenerateIdempotencyKey,
  checkGenerationGate,
  classifyQuestionState,
  computeDownstreamQuestionIds,
  computeTemplateProgress,
  getPhaseForQuestion,
  getTemplate,
  isPhaseLocked,
  planImportAccept,
  resolveAnswerTransition,
  type AnswerState,
  type AnswerStateMap,
} from "../../../modules/authoring/domain/authoring-domain.js";
import { sniffFileKind } from "../../../modules/authoring/domain/file-sniff.js";

function completeAll(template: (typeof TEMPLATES)[number]): AnswerStateMap {
  const map: AnswerStateMap = {};
  for (const phase of template.phases) {
    for (const { question_id } of phase.questions) {
      map[question_id] = { status: "complete", needs_review: false };
    }
  }
  return map;
}

test("P3 T2 — answer state machine: draft/complete/reopen", () => {
  assert.deepEqual(resolveAnswerTransition("save_draft", undefined), {
    status: "draft",
    transition: "create",
  });
  assert.deepEqual(resolveAnswerTransition("save_draft", "draft"), {
    status: "draft",
    transition: "draft_save",
  });
  assert.deepEqual(resolveAnswerTransition("complete", "draft"), {
    status: "complete",
    transition: "complete",
  });
  // Reopen: save_draft on a complete answer reverts to draft (clause 6).
  assert.deepEqual(resolveAnswerTransition("save_draft", "complete"), {
    status: "draft",
    transition: "reopen",
  });
  assert.deepEqual(resolveAnswerTransition("complete", "complete"), {
    status: "complete",
    transition: "complete",
  });
});

test("P3 T3 — phase lock/unlock matches configured prerequisites (clause 5)", () => {
  const cp1 = getTemplate("cp1")!;
  const phase = getPhaseForQuestion(cp1, "cp1_customer_story")!;
  assert.ok(phase.unlock_requires.includes("cp1_primary_customer"));

  // Dependency incomplete → phase locked.
  assert.equal(isPhaseLocked(phase, {}), true);
  // Dependency complete → phase unlocked (even though the question itself is unanswered).
  const answers: AnswerStateMap = {
    cp1_primary_customer: { status: "complete", needs_review: false },
  };
  assert.equal(isPhaseLocked(phase, answers), false);
  assert.equal(classifyQuestionState(cp1, "cp1_customer_story", answers), "unanswered");
});

test("P3 T3 — classifyQuestionState precedence: locked > needs_review > status", () => {
  const cp1 = getTemplate("cp1")!;
  const answers: AnswerStateMap = {
    // cp1_primary_customer stays incomplete → dependent phase locked.
    cp1_customer_story: { status: "complete", needs_review: false },
  };
  assert.equal(classifyQuestionState(cp1, "cp1_customer_story", answers), "locked");

  const unlocked: AnswerStateMap = {
    cp1_primary_customer: { status: "complete", needs_review: false },
    cp1_customer_story: { status: "complete", needs_review: true },
  };
  assert.equal(classifyQuestionState(cp1, "cp1_customer_story", unlocked), "needs_review");
});

test("P3 T3 — computeDownstreamQuestionIds follows the dependency graph transitively", () => {
  const cp1 = getTemplate("cp1")!;
  const downstream = computeDownstreamQuestionIds(cp1, "cp1_primary_customer");

  // Direct phase (cau_chuyen_khach_hang) and sibling phase (pain_point).
  assert.ok(downstream.includes("cp1_customer_story"));
  assert.ok(downstream.includes("cp1_main_problem"));
  // Transitive: pain_point → giai_phap → mvp.
  assert.ok(downstream.includes("cp1_solution_description"));
  assert.ok(downstream.includes("cp1_mvp_definition"));
  // Never the edited question itself; never an unrelated phase.
  assert.ok(!downstream.includes("cp1_primary_customer"));
  assert.ok(!downstream.includes("cp1_team_name"));
});

test("P3 T4 — generation gate blocks on required incomplete or stale; optional only warns", () => {
  const cp1 = getTemplate("cp1")!;
  const all = completeAll(cp1);
  assert.equal(checkGenerationGate(cp1, all).ok, true);

  // Missing a required question → blocked.
  const missingRequired: AnswerStateMap = { ...all };
  delete missingRequired["cp1_idea_name"];
  const missingGate = checkGenerationGate(cp1, missingRequired);
  assert.equal(missingGate.ok, false);
  assert.ok(missingGate.missing_required.includes("cp1_idea_name"));

  // Stale required question → blocked.
  const stale: AnswerStateMap = { ...all };
  stale["cp1_main_problem"] = { status: "complete", needs_review: true };
  const staleGate = checkGenerationGate(cp1, stale);
  assert.equal(staleGate.ok, false);
  assert.ok(staleGate.stale_required.includes("cp1_main_problem"));

  // Optional omission → warning only, never a block (clause 8).
  const optionalOmission: AnswerStateMap = { ...all };
  delete optionalOmission["cp1_team_name"]; // recommended
  const optionalGate = checkGenerationGate(cp1, optionalOmission);
  assert.equal(optionalGate.ok, true);
  assert.ok(optionalGate.warnings.includes("cp1_team_name"));
});

test("P3 T5 — generate idempotency key is snapshot- and template- scoped", () => {
  const base = buildGenerateIdempotencyKey("case-1", "cp1", { a: 1, b: 2 });
  // Key order must not matter (stable serialization).
  assert.equal(base, buildGenerateIdempotencyKey("case-1", "cp1", { b: 2, a: 1 }));
  // Changed snapshot → new key (new immutable version).
  assert.notEqual(base, buildGenerateIdempotencyKey("case-1", "cp1", { a: 1, b: 3 }));
  // Different case / template → different key.
  assert.notEqual(base, buildGenerateIdempotencyKey("case-2", "cp1", { a: 1, b: 2 }));
  assert.notEqual(base, buildGenerateIdempotencyKey("case-1", "cp2", { a: 1, b: 2 }));
});

test("P3 T8 — import accept: draft-only, never overwrites existing answers", () => {
  const items = [
    { question_id: "cp1_idea_name", proposed_text: "Ý tưởng X", source_pointer: "doc.md:§1" },
    { question_id: "cp1_team_name", proposed_text: "Nhóm Y", source_pointer: "doc.md:§2" },
  ];

  // No existing answer → applied.
  const fresh = planImportAccept(items, ["cp1_idea_name"], {});
  assert.deepEqual(fresh.applied.map((i) => i.question_id), ["cp1_idea_name"]);
  assert.deepEqual(fresh.conflicts, []);
  assert.deepEqual(fresh.skipped, []);

  // Existing answer (any status) → conflict, not silently overwritten (clause 13).
  const existing: AnswerStateMap = {
    cp1_idea_name: { status: "complete", needs_review: false },
  };
  const conflict = planImportAccept(items, ["cp1_idea_name"], existing);
  assert.deepEqual(conflict.applied, []);
  assert.deepEqual(conflict.conflicts, ["cp1_idea_name"]);

  // Unknown accepted id → skipped.
  const unknown = planImportAccept(items, ["cp1_missing"], {});
  assert.deepEqual(unknown.applied, []);
  assert.deepEqual(unknown.skipped, ["cp1_missing"]);
});

test("P3 — template progress counts required/recommended/supplemental", () => {
  const cp2 = getTemplate("cp2")!;
  const all = completeAll(cp2);
  const progress = computeTemplateProgress(cp2, all);
  assert.equal(progress.required_done, progress.required_total);
  assert.equal(progress.total_done, progress.total);
  assert.ok(progress.required_total > 0);

  const partial: AnswerStateMap = {};
  for (const phase of cp2.phases) {
    for (const { question_id, classification } of phase.questions) {
      if (classification === "required") {
        partial[question_id] = { status: "complete", needs_review: false };
      }
    }
  }
  const partialProgress = computeTemplateProgress(cp2, partial);
  assert.equal(partialProgress.required_done, partialProgress.required_total);
  assert.equal(partialProgress.recommended_done, 0);
  assert.ok(partialProgress.total_done < partialProgress.total);
});

test("P3 — catalog loaded and validated at module load (cp1 + cp2)", () => {
  assert.equal(TEMPLATES.length, 2);
  assert.equal(getTemplate("cp1")?.template_key, "cp1");
  assert.equal(getTemplate("cp2")?.template_key, "cp2");
});

test("P3 — file sniffing detects pdf/docx/text by magic bytes", () => {
  assert.equal(sniffFileKind(Buffer.from("%PDF-1.7\n%xxxx")), "pdf");
  assert.equal(sniffFileKind(Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00])), "docx");
  assert.equal(sniffFileKind(Buffer.from("# hello markdown")), "text");
});
