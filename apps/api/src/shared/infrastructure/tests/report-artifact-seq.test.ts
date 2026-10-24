import assert from "node:assert/strict";
import { test } from "node:test";
import { Prisma } from "@prisma/client";
import { upsertReportArtifactDocumentRecord } from "../../../modules/documents/infrastructure/persistence/document.repository.js";

type Client = Parameters<typeof upsertReportArtifactDocumentRecord>[6];
type Upsert = { create: { seq: number; is_primary: boolean }; update: Record<string, unknown> };

/** In-memory (unit, seq) unique key shared by every finalizer, like the real table. */
function fakeTable(takenSeqs: number[]) {
  const upserts: Upsert[] = [];
  let reads = 0;
  const client = {
    user: { findUnique: async () => ({ id: "u1" }) },
    documentRecord: {
      aggregate: async () => (reads++, { _max: { seq: takenSeqs.length ? Math.max(...takenSeqs) : null } }),
      upsert: async (args: Upsert) => {
        if (takenSeqs.includes(args.create.seq)) {
          throw new Prisma.PrismaClientKnownRequestError("unique", { code: "P2002", clientVersion: "test" });
        }
        takenSeqs.push(args.create.seq);
        upserts.push(args);
        return args;
      },
    },
  };
  return { client: client as unknown as Client, upserts, reads: () => reads, takenSeqs };
}

const artifact = (client: Client, unitId: string | null) =>
  upsertReportArtifactDocumentRecord("case-1", "cp-1", unitId, null, "report-1", "u1", client);

test("a graded-again unit gets the next artifact seq instead of colliding on (unit, doc_type, seq)", async () => {
  const first = fakeTable([]);
  await artifact(first.client, "unit-1");
  assert.deepEqual([first.upserts[0].create.seq, first.upserts[0].create.is_primary], [0, true]);

  const again = fakeTable([0]);
  await artifact(again.client, "unit-1");
  assert.deepEqual([again.upserts[0].create.seq, again.upserts[0].create.is_primary], [1, false]);
  assert.equal("seq" in again.upserts[0].update, false);
});

test("a report without a lifecycle unit keeps seq 0", async () => {
  const { client, upserts } = fakeTable([5]);
  await artifact(client, null);
  assert.equal(upserts[0].create.seq, 0);
});

test("two finalizers racing for the same seq both keep their artifact", async () => {
  const table = fakeTable([0]);
  // Both read max=0 before either writes, so both try seq 1; the second must recompute, not drop its artifact.
  const results = await Promise.all([artifact(table.client, "unit-1"), artifact(table.client, "unit-1")]);
  assert.equal(results.length, 2);
  assert.deepEqual([...table.takenSeqs].sort(), [0, 1, 2]);
});

test("a non-conflict database error is not retried away", async () => {
  const { client } = fakeTable([]);
  (client as unknown as { documentRecord: { upsert: () => Promise<never> } }).documentRecord.upsert = async () => {
    throw new Error("connection lost");
  };
  await assert.rejects(artifact(client, "unit-1"), /connection lost/);
});
