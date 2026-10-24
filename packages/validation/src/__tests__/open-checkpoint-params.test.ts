import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { OpenCheckpointParamsSchema } from "../index.js";

describe("OpenCheckpointParamsSchema", () => {
  it("accepts every checkpoint the gallery opens on demand", () => {
    for (const code of ["CP2", "CP3"]) {
      assert.equal(OpenCheckpointParamsSchema.safeParse({ code }).success, true, code);
    }
  });

  it("rejects CP1 (created with the case), CP4 (no open flow) and unknown codes", () => {
    for (const code of ["CP1", "CP4", "PITCH", "cp2", ""]) {
      assert.equal(OpenCheckpointParamsSchema.safeParse({ code }).success, false, code);
    }
  });
});
