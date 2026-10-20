import assert from "node:assert/strict";
import { test } from "node:test";
import { ATTACHMENT_MANIFEST_FILE, buildAttachmentManifest, manifestEntry } from "../../../modules/ai-engine/application/attachment-manifest.js";

const doc = (metadata_json: unknown) => ({ original_name: "Interview.docx", extension: "docx", metadata_json });

test("manifest entry carries the team's declared category and its Vietnamese label", () => {
  assert.deepEqual(manifestEntry("attachments/Interview.docx", doc({ category: "interview_survey" }), "CP2"), {
    file: "attachments/Interview.docx",
    stage: "CP2",
    role: "submission",
    original_name: "Interview.docx",
    extension: "docx",
    category: "interview_survey",
    category_label: "Phỏng vấn / khảo sát khách hàng",
  });
  assert.equal(manifestEntry("a", doc({ category: "lecturer_guidance" }), "CP1", "context").role, "context");
  assert.equal(manifestEntry("a", doc({ category: "lecturer_guidance" }), "CP1").category_label, "Hướng dẫn / yêu cầu từ giảng viên");
});

test("legacy category codes are canonicalized; a missing category stays null instead of claiming 'other'", () => {
  assert.equal(manifestEntry("a", doc({ category: "competitor_analysis" }), "CP1").category, "market_research");
  for (const metadata of [null, undefined, {}, { category: "" }, { category: 5 }, "x"]) {
    const entry = manifestEntry("a", doc(metadata), "CP1");
    assert.equal(entry.category, null);
    assert.equal(entry.category_label, null);
  }
});

test("manifest is omitted for no files, otherwise one JSON file listing every entry in order", () => {
  assert.equal(buildAttachmentManifest([]), null);
  const built = buildAttachmentManifest([manifestEntry("b.pdf", doc({ category: "other" }), "CP1"), manifestEntry("a.pdf", doc(null), "CP1")]);
  assert.equal(built?.name, ATTACHMENT_MANIFEST_FILE);
  const parsed = JSON.parse(String(built?.content)) as { declared_by: string; files: Array<{ file: string }> };
  assert.equal(parsed.declared_by, "team");
  assert.deepEqual(parsed.files.map((f) => f.file), ["b.pdf", "a.pdf"]);
});
