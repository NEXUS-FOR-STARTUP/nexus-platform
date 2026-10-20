import assert from "node:assert/strict";
import { test } from "node:test";
import { upsertReportArtifactDocumentRecord } from "../../../modules/documents/infrastructure/persistence/document.repository.js";

type Upsert = { create: { seq: number; is_primary: boolean }; update: Record<string, unknown> };

function fakeClient(maxSeq: number | null) {
  const upserts: Upsert[] = [];
  const client = {
    user: { findUnique: async () => ({ id: "u1" }) },
    documentRecord: {
      aggregate: async () => ({ _max: { seq: maxSeq } }),
      upsert: async (args: Upsert) => (upserts.push(args), args),
    },
  };
  return { client: client as unknown as Parameters<typeof upsertReportArtifactDocumentRecord>[6], upserts };
}

const artifact = (client: Parameters<typeof upsertReportArtifactDocumentRecord>[6], unitId: string | null) =>
  upsertReportArtifactDocumentRecord("case-1", "cp-1", unitId, null, "report-1", "u1", client);

test("a graded-again unit gets the next artifact seq instead of colliding on (unit, doc_type, seq)", async () => {
  const first = fakeClient(null);
  await artifact(first.client, "unit-1");
  assert.deepEqual([first.upserts[0].create.seq, first.upserts[0].create.is_primary], [0, true]);

  const again = fakeClient(0);
  await artifact(again.client, "unit-1");
  assert.deepEqual([again.upserts[0].create.seq, again.upserts[0].create.is_primary], [1, false]);
  assert.equal("seq" in again.upserts[0].update, false);
});

test("a report without a lifecycle unit keeps seq 0 and never queries the unit", async () => {
  const { client, upserts } = fakeClient(5);
  await artifact(client, null);
  assert.equal(upserts[0].create.seq, 0);
});
