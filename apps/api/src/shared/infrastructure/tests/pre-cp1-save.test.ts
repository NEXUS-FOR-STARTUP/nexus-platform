import { test } from "node:test";
import assert from "node:assert";
import { PreCp1InputSchema, type LabelQuote, type TeamFitSavedResult } from "@repo/validation";
import {
  savePreCp1UseCase,
  hashPreCp1Input,
  type AttachPreCp1AiData,
  type CreatePreCp1ReportData,
  type SavePreCp1Deps,
} from "../../../modules/pre-cp1/application/save-pre-cp1.usecase.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const INPUT = PreCp1InputSchema.parse({
  school: "fpt",
  course: "exe101",
  goal: "pass",
  budget: "b1",
  team: [{ major: "Kinh doanh", caps: { sell: 2 }, unsure: false, name: "An" }],
  assets: {},
  assetsNone: [],
  network: ["classmates"],
  ideaMode: "structured",
  sensitive: [],
  assetTags: {},
  ideaTags: {},
  madlibs: {
    projectName: "Quán Xanh",
    field: "đồ uống",
    targetCustomer: "quán cà phê nhỏ quanh trường",
    problem: "khách đặt món qua ba kênh nên chủ quán hay làm sót đơn",
    solution: "một bảng Sheet chung và tin nhắn Zalo nhắc đơn",
    mvp: "một quán quen dùng thử Sheet ghi đơn trong 1 tuần",
  },
});

const LABELS: LabelQuote[] = [{ id: "fnb", quote: "quán cà phê" }];
const AI = { version: 2 } as unknown as TeamFitSavedResult;

function deps(options: { has_ai_labels: boolean }) {
  const calls = { created: [] as CreatePreCp1ReportData[], attached: [] as AttachPreCp1AiData[] };
  const report = {
    id: "report_1",
    report_snapshot: { flags: [] },
    has_ai_labels: options.has_ai_labels,
  };
  const fake: SavePreCp1Deps & { calls: typeof calls } = {
    calls,
    findCaseOwnedBy: async () => ({ id: "case_1" }),
    findReportByHash: async () => report,
    createReport: async (data) => {
      calls.created.push(data);
      return { id: "report_1" };
    },
    attachAi: async (data) => {
      calls.attached.push(data);
    },
  };
  return fake;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test("first save stores the answers without waiting for the AI", async () => {
  const d = deps({ has_ai_labels: false });
  d.findReportByHash = async () => null;

  const result = await savePreCp1UseCase(
    { caseId: "case_1", userId: "user_1", input: INPUT, aiLabels: null, aiResult: null },
    d,
  );

  assert.equal(result.isNew, true);
  assert.equal(d.calls.created.length, 1);
  assert.equal(d.calls.created[0]!.aiResult, null);
  assert.equal(d.calls.attached.length, 0);
});

test("the second save of the same answers lands the AI verdict", async () => {
  const d = deps({ has_ai_labels: false });

  const result = await savePreCp1UseCase(
    {
      caseId: "case_1",
      userId: "user_1",
      input: INPUT,
      aiLabels: LABELS,
      aiResult: AI,
    },
    d,
  );

  assert.equal(result.isNew, false);
  assert.equal(d.calls.created.length, 0, "same answers must not create a second report");
  assert.equal(d.calls.attached.length, 1);
  const attached = d.calls.attached[0]!;
  assert.equal(attached.inputHash, hashPreCp1Input(INPUT));
  assert.deepEqual(attached.aiLabels, LABELS);
  assert.equal(attached.teamFit?.team.length, 1);
});

test("a third save keeps the labels already stored", async () => {
  const d = deps({ has_ai_labels: true });

  await savePreCp1UseCase(
    { caseId: "case_1", userId: "user_1", input: INPUT, aiLabels: LABELS, aiResult: AI },
    d,
  );

  assert.equal(d.calls.attached[0]?.aiLabels, null, "stored labels are not overwritten");
  assert.notEqual(d.calls.attached[0]?.aiResult, null);
});

test("an AI verdict without the six idea boxes is rejected, never stored blank", async () => {
  const d = deps({ has_ai_labels: false });
  const draft = PreCp1InputSchema.parse({ ...INPUT, ideaMode: "draft", madlibs: {} });

  await assert.rejects(
    savePreCp1UseCase(
      { caseId: "case_1", userId: "user_1", input: draft, aiLabels: null, aiResult: AI },
      d,
    ),
    /PRE_CP1_AI_MISMATCH|sáu câu/,
  );
  assert.equal(d.calls.created.length + d.calls.attached.length, 0);
});

test("someone else's case cannot be saved", async () => {
  const d = deps({ has_ai_labels: false });
  d.findCaseOwnedBy = async () => null;

  await assert.rejects(
    savePreCp1UseCase(
      { caseId: "case_x", userId: "user_1", input: INPUT, aiLabels: null, aiResult: null },
      d,
    ),
    /CASE_NOT_FOUND|Không tìm thấy/,
  );
});
