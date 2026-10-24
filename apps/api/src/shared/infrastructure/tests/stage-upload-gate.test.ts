import test from "node:test";
import assert from "node:assert/strict";
import { uploadStageDocumentsUseCase } from "../../../modules/cases/application/upload-stage-documents.usecase.js";

// The gate runs before any DB access, so no mocks are needed.
test("stage upload is refused for stages without a grading service", async () => {
  for (const code of ["CP4", "PITCH", "CP9"]) {
    await assert.rejects(
      () => uploadStageDocumentsUseCase("user-1", "case-1", code, []),
      { message: "Giai đoạn này chưa mở" },
      code,
    );
  }
});
