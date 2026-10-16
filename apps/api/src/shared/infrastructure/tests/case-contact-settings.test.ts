import { test } from "node:test";
import assert from "node:assert";
import { isCaseContactComplete } from "@repo/validation";
import { mergeCaseContact } from "../../../modules/cases/infrastructure/persistence/case.repository.js";

process.env.NODE_ENV = "test";

const baseCase = {
  id: "case-1",
  owner_auth_user_id: "owner-1",
  members: [{ auth_user_id: "member-1" }],
  user_facing_stage: "submitted",
  team_name: "Team",
  school: null,
  course_context: null,
  group_no: null,
  contact_profile: null as Record<string, string> | null,
};

function makeDeps(initialContent: Record<string, unknown> | null, profile: Record<string, string> | null = null) {
  const saved: { content?: Record<string, any>; profile?: Record<string, string>; writes: number } = { writes: 0 };
  return {
    saved,
    deps: {
      findCaseByIdWithMembers: async () => ({ ...baseCase, contact_profile: profile }) as any,
      findFirstIntakeUnit: async () =>
        initialContent ? ({ id: "unit-1", content: JSON.stringify(initialContent) } as any) : null,
      updateCaseSettings: async () => baseCase as any,
      saveIntakeUnitContent: async (_unit: string, content: string) => {
        saved.writes++;
        saved.content = JSON.parse(content);
      },
      saveCaseContactProfile: async (_id: string, p: Record<string, string>) => {
        saved.profile = p;
      },
    },
  };
}

test("updateCaseSettingsUseCase contact", async (t) => {
  const { updateCaseSettingsUseCase } = await import(
    "../../../modules/cases/application/update-case-settings.usecase.js"
  );

  await t.test("partial merge keeps other contact fields", async () => {
    const { saved, deps } = makeDeps({
      contact: { full_name: "Nguyen A", zalo: "0912345678", email: "a@x.com", telegram: "@a" },
    });
    await updateCaseSettingsUseCase("owner-1", "user", "case-1", { contact: { email: "b@x.com" } }, deps);
    assert.deepEqual(saved.content?.contact, {
      full_name: "Nguyen A",
      zalo: "0912345678",
      email: "b@x.com",
      telegram: "@a",
    });
  });

  await t.test("no intake unit -> saved to contact_profile, no unit/checkpoint created", async () => {
    const { saved, deps } = makeDeps(null, { email: "old@x.com" });
    await updateCaseSettingsUseCase("member-1", "user", "case-1", { contact: { full_name: " Tran B " } }, deps);
    assert.deepEqual(saved.profile, { email: "old@x.com", full_name: "Tran B" });
    assert.equal(saved.writes, 0);
    assert.equal(saved.content, undefined);
  });

  await t.test("with intake unit -> unit updated, profile untouched", async () => {
    const { saved, deps } = makeDeps({ contact: { full_name: "A" } }, { zalo: "0912345678" });
    await updateCaseSettingsUseCase("owner-1", "user", "case-1", { contact: { email: "a@x.com" } }, deps);
    assert.equal(saved.profile, undefined);
    assert.deepEqual(saved.content?.contact, { full_name: "A", zalo: "0912345678", email: "a@x.com" });
  });

  await t.test("invalid zalo -> 400", async () => {
    const { deps } = makeDeps({});
    await assert.rejects(
      updateCaseSettingsUseCase("owner-1", "user", "case-1", { contact: { zalo: "123" } }, deps),
      (e: any) => e.status === 400 && e.code === "VALIDATION_ERROR",
    );
  });

  await t.test("invalid email -> 400", async () => {
    const { deps } = makeDeps({});
    await assert.rejects(
      updateCaseSettingsUseCase("owner-1", "user", "case-1", { contact: { email: "nope" } }, deps),
      (e: any) => e.status === 400,
    );
  });

  await t.test("non-member -> 403", async () => {
    const { deps } = makeDeps({});
    await assert.rejects(
      updateCaseSettingsUseCase("stranger", "user", "case-1", { contact: { email: "a@x.com" } }, deps),
      (e: any) => e.status === 403,
    );
  });
});

test("isCaseContactComplete boundaries", () => {
  const ok = { full_name: "A", zalo: "0912345678", email: "a@x.com" };
  assert.equal(isCaseContactComplete(ok), true);
  assert.equal(isCaseContactComplete(null), false);
  assert.equal(isCaseContactComplete("x"), false);
  assert.equal(isCaseContactComplete({ ...ok, full_name: "  " }), false);
  assert.equal(isCaseContactComplete({ ...ok, zalo: "091234567" }), false);
  assert.equal(isCaseContactComplete({ ...ok, zalo: "09123456789" }), false);
  assert.equal(isCaseContactComplete({ ...ok, zalo: "09123abcde" }), false);
  assert.equal(isCaseContactComplete({ ...ok, email: "nope" }), false);
  assert.equal(isCaseContactComplete({ ...ok, email: undefined }), false);
});

test("mergeCaseContact precedence", () => {
  assert.deepEqual(
    mergeCaseContact({ full_name: "P", zalo: "0912345678" }, { full_name: "U", email: "u@x.com" }),
    { full_name: "U", zalo: "0912345678", email: "u@x.com" },
  );
  // blank unit field does not erase profile value
  assert.deepEqual(mergeCaseContact({ email: "p@x.com" }, { email: "  " }), { email: "p@x.com" });
  assert.deepEqual(mergeCaseContact(null, undefined), {});
});
