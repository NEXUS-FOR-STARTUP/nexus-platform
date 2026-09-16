import test from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { localizeAndCleanMarkdown } from "../../../modules/reports/infrastructure/pdf/mdNormalizer.js";
import { markdownToTypst } from "../../../modules/reports/infrastructure/pdf/mdToTypst.js";
import { generateReportPdfBuffer } from "../../../modules/reports/infrastructure/pdf/pdfService.js";

test("typst-pdf-pipeline: mdNormalizer cleans bilingual notes and strips internal error codes", () => {
  const rawMarkdown = `
## 2. Bảng trạng thái 13 trường dữ liệu chuẩn
| Trường dữ liệu (Field) | Trạng thái | Nhận xét |
|---|---|---|
| Target customer (Khách hàng mục tiêu) | Good enough | ERR_TARGET_GENERIC_STUDENT Rất rõ ràng |
| Pain point (Nỗi đau khách hàng) | Too vague | Cần cụ thể hơn |
  `.trim();

  const cleaned = localizeAndCleanMarkdown(rawMarkdown);

  assert.ok(!cleaned.includes("(Field)"), "Should not contain (Field)");
  assert.ok(!cleaned.includes("ERR_TARGET_GENERIC_STUDENT"), "Should strip internal error codes");
  assert.ok(cleaned.includes("Khách hàng mục tiêu"), "Should keep Vietnamese term");
  assert.ok(cleaned.includes("Vấn đề khách hàng"), "Should clean pain point label");
});

test("typst-pdf-pipeline: mdToTypst converts markdown table to Typst #context table markup", () => {
  const md = `
| Hạng mục | Trạng thái |
|---|---|
| Khách hàng mục tiêu | Đạt yêu cầu |
  `.trim();

  const typst = markdownToTypst(md);
  assert.ok(typst.includes("table("), "Should generate Typst table");
  assert.ok(typst.includes("#context"), "Should wrap in #context for dynamic width calculation");
  assert.ok(typst.includes("Khách hàng mục tiêu"), "Should contain cell content");
});

test("typst-pdf-pipeline: generateReportPdfBuffer produces valid A4 PDF buffer with %PDF- header", async () => {
  const sampleMd = `
## 1. Tóm tắt điều hành
Dự án PodCycle giải quyết bài toán tái chế bã cà phê tại các chuỗi F&B.

## 2. Bảng rà soát 13 hạng mục thông tin
| Hạng mục | Trạng thái | Nhận xét |
|---|---|---|
| Khách hàng mục tiêu | Đạt yêu cầu | Phân khúc chuỗi cafe rõ ràng |
| Mô tả giải pháp | Đạt yêu cầu | Quy trình thu gom khả thi |
  `.trim();

  const buf = await generateReportPdfBuffer({
    markdown: sampleMd,
    meta: {
      projectName: "PodCycle - Tái chế bã cà phê",
      jobId: "test-podcycle-001",
      agentName: "omp",
      createdAt: new Date().toISOString(),
      overallScore: 82,
      verdict: "READY FOR REALITY CHECK",
      categoryScores: {
        problemClarity: 85,
        marketViability: 80,
        businessModel: 85,
        competitiveMoat: 78,
        executionFeasibility: 82,
      },
    },
    storageDir: resolve(process.cwd(), "storage"),
    force: true,
  });

  assert.ok(buf instanceof Buffer, "Should return a Buffer");
  assert.ok(buf.length > 20000, `Buffer should be at least 20KB, got ${buf.length}`);
  const magic = buf.subarray(0, 5).toString();
  assert.strictEqual(magic, "%PDF-", "PDF header magic bytes must be %PDF-");
});
