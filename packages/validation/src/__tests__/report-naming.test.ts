import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  makeDownloadSlug,
  formatReportTimestamp,
  getSubmissionTypeFileSlug,
  buildStandardReportPdfFilename,
  getReportStageFileSlug,
  CP2_REPORT_TYPES,
  SUBMISSION_TYPE_FILE_SLUGS,
  SUBMISSION_TYPE_DISPLAY_LABELS,
} from "../index.js";

describe("Report Naming Utilities (@repo/validation)", () => {
  describe("makeDownloadSlug", () => {
    it("converts Vietnamese diacritics into ASCII without tone marks", () => {
      assert.strictEqual(
        makeDownloadSlug("Đề Án Khởi Nghiệp Nông Sản Sạch"),
        "de_an_khoi_nghiep_nong_san_sach"
      );
      assert.strictEqual(
        makeDownloadSlug("Ứng Dụng Học Tập Thông Minh"),
        "ung_dung_hoc_tap_thong_minh"
      );
      assert.strictEqual(
        makeDownloadSlug("đường đời đầy đầm ấm"),
        "duong_doi_day_dam_am"
      );
    });

    it("handles spaces, tabs, and multiple consecutive whitespace characters", () => {
      assert.strictEqual(makeDownloadSlug("Farm2Dorm    App"), "farm2dorm_app");
      assert.strictEqual(makeDownloadSlug("  Dự   Án   Mới  "), "du_an_moi");
    });

    it("strips special symbols and punctuation safely", () => {
      assert.strictEqual(
        makeDownloadSlug("Farm2Dorm — Nông Sản Sạch (2026)!"),
        "farm2dorm_nong_san_sach_2026"
      );
      assert.strictEqual(
        makeDownloadSlug("AI/ML & IoT: Giải Pháp Toàn Diện @#$"),
        "ai_ml_iot_giai_phap_toan_dien"
      );
      assert.strictEqual(
        makeDownloadSlug("Project___Name---Test"),
        "project_name_test"
      );
    });

    it("falls back to 'de_an' when input is empty, null, undefined, or non-string", () => {
      assert.strictEqual(makeDownloadSlug(""), "de_an");
      assert.strictEqual(makeDownloadSlug("   "), "de_an");
      assert.strictEqual(makeDownloadSlug("---___---"), "de_an");
      assert.strictEqual(makeDownloadSlug(null as unknown as string), "de_an");
      assert.strictEqual(makeDownloadSlug(undefined as unknown as string), "de_an");
      assert.strictEqual(makeDownloadSlug(123 as unknown as string), "de_an");
    });

    it("truncates slug length to at most 50 characters", () => {
      const longName =
        "Dự án khởi nghiệp công nghệ thông tin phát triển nền tảng giáo dục trực tuyến toàn diện cho sinh viên";
      const slug = makeDownloadSlug(longName);
      assert.ok(slug.length <= 50);
      assert.strictEqual(
        slug,
        "du_an_khoi_nghiep_cong_nghe_thong_tin_phat_trien_n"
      );
    });
  });

  describe("formatReportTimestamp", () => {
    it("formats a Date object to exactly 14 characters in YYYYMMDDHHmmss format", () => {
      const date = new Date(2026, 8, 20, 14, 30, 12); // Month is 0-indexed: 8 = September
      assert.strictEqual(formatReportTimestamp(date), "20260920143012");
    });

    it("pads single-digit month, day, hours, minutes, seconds with leading zeros", () => {
      const date = new Date(2026, 0, 5, 4, 3, 2); // 2026-01-05 04:03:02
      assert.strictEqual(formatReportTimestamp(date), "20260105040302");
    });

    it("parses valid ISO date string correctly", () => {
      const iso = "2026-09-20T14:30:12.000Z";
      const result = formatReportTimestamp(iso);
      assert.match(result, /^[0-9]{14}$/);
      assert.strictEqual(result.length, 14);
    });

    it("gracefully falls back to current time for null, undefined, or invalid dates", () => {
      const nullResult = formatReportTimestamp(null);
      assert.match(nullResult, /^[0-9]{14}$/);
      assert.strictEqual(nullResult.length, 14);

      const undefinedResult = formatReportTimestamp(undefined);
      assert.match(undefinedResult, /^[0-9]{14}$/);
      assert.strictEqual(undefinedResult.length, 14);

      const invalidResult = formatReportTimestamp("not-a-valid-date");
      assert.match(invalidResult, /^[0-9]{14}$/);
      assert.strictEqual(invalidResult.length, 14);
    });
  });

  describe("getSubmissionTypeFileSlug", () => {
    it("maps standard submission types to their respective slugs", () => {
      assert.strictEqual(getSubmissionTypeFileSlug("initial"), "lan_dau");
      assert.strictEqual(getSubmissionTypeFileSlug("resubmit"), "da_sua");
      assert.strictEqual(getSubmissionTypeFileSlug("logic_check"), "soi_logic");
    });

    it("falls back to 'phan_bien' when submissionType is null, undefined, or unknown", () => {
      assert.strictEqual(getSubmissionTypeFileSlug(null), "phan_bien");
      assert.strictEqual(getSubmissionTypeFileSlug(undefined), "phan_bien");
      assert.strictEqual(getSubmissionTypeFileSlug(""), "phan_bien");
      assert.strictEqual(getSubmissionTypeFileSlug("unknown_stage"), "phan_bien");
    });

    it("verifies constant mappings match expected constants", () => {
      assert.strictEqual(SUBMISSION_TYPE_FILE_SLUGS["initial"], "lan_dau");
      assert.strictEqual(SUBMISSION_TYPE_FILE_SLUGS["resubmit"], "da_sua");
      assert.strictEqual(SUBMISSION_TYPE_FILE_SLUGS["logic_check"], "soi_logic");

      assert.strictEqual(SUBMISSION_TYPE_DISPLAY_LABELS["initial"], "Lần đầu");
      assert.strictEqual(SUBMISSION_TYPE_DISPLAY_LABELS["resubmit"], "Đã sửa");
      assert.strictEqual(SUBMISSION_TYPE_DISPLAY_LABELS["logic_check"], "Soi logic");
    });
  });

  describe("buildStandardReportPdfFilename", () => {
    it("includes project, stage, submission type and timestamp without version suffix", () => {
      const filename = buildStandardReportPdfFilename({
        projectName: "Farm2Dorm — Nông Sản Sạch",
        stageSlug: "thi_truong",
        submissionType: "initial",
        createdAt: new Date(2026, 8, 20, 14, 30, 12),
      });
      assert.strictEqual(
        filename,
        "farm2dorm_nong_san_sach_thi_truong_lan_dau_20260920143012.pdf"
      );
    });

    it("maps report type to stage slug", () => {
      assert.strictEqual(getReportStageFileSlug("input_clarification"), "y_tuong");
      assert.strictEqual(getReportStageFileSlug(undefined), "y_tuong");
      assert.strictEqual(getReportStageFileSlug(CP2_REPORT_TYPES[0]), "thi_truong");
    });

    it("uses default fallbacks when optional parameters are missing", () => {
      const filename = buildStandardReportPdfFilename({ projectName: "", stageSlug: "y_tuong" });
      assert.match(filename, /^de_an_y_tuong_phan_bien_[0-9]{14}\.pdf$/);
    });
  });
});
