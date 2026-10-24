import type { AuditCheckpointCode } from "@app/shared";
import { isCp2ReportType, isCp3ReportType } from "@repo/validation";

export type AuditScope = "full" | "questionnaire";

/**
 * Everything the student UI needs to know about a grading stage that is not shared by all of them.
 * One entry per checkpoint code: adding a code to `AUDIT_CHECKPOINTS` fails to compile here until
 * the stage declares its UI, instead of growing another `isCp2` branch.
 */
export interface AuditStageUi {
  /** The student picks what to grade (answers / files / both) and readiness comes from the stage summary. CP1 has no such choice. */
  sourceBased: boolean;
  /** Scopes the student can choose; more than one shows the "how far" step. The first one is the default. */
  scopes: readonly [AuditScope, ...AuditScope[]];
  answersHint?: string;
  filesHint: string;
  /** Shown above the files list: reminds the team to remove personal data from what they upload. */
  privacyNotice: string | null;
  /** What the grader covers and what it leaves out, shown in the confirm modal. */
  scopeNote: string | null;
  /** Shown after the checkpoint is opened for the first time; also the error title when opening fails. */
  openErrorTitle: string;
  openLabel: string;
  /** Hint for the optional note to the grader. */
  notePlaceholder: string;
  changePlaceholder: string;
}

export const AUDIT_STAGE_UI: Record<AuditCheckpointCode, AuditStageUi> = {
  CP1: {
    sourceBased: false,
    scopes: ["full"],
    filesHint: "Không bắt buộc nếu bạn đã trả lời câu hỏi ở tab Soạn thảo",
    privacyNotice: null,
    scopeNote: null,
    openErrorTitle: "Không thể bắt đầu vòng Ý tưởng",
    openLabel: "Bắt đầu vòng Ý tưởng",
    notePlaceholder: "Ví dụ: soi kỹ phần thị trường mục tiêu giúp mình",
    changePlaceholder: "Ví dụ: bổ sung phỏng vấn, đổi khách hàng mục tiêu",
  },
  CP2: {
    sourceBased: true,
    scopes: ["full", "questionnaire"],
    answersHint: "Không bắt buộc nếu bạn chấm bằng tài liệu. Nếu dùng, cần đủ số câu có nội dung thật, mỗi câu viết thành câu hoàn chỉnh",
    filesHint: "Không bắt buộc nếu bạn chấm bằng câu trả lời. Ghi chép phỏng vấn .docx/.pdf, khảo sát .xlsx nếu có làm",
    privacyNotice: "Nếu tải lên ghi chép phỏng vấn hoặc dữ liệu khảo sát, vui lòng xóa hoặc ẩn các thông tin cá nhân (email, số điện thoại, tên người được hỏi).",
    scopeNote: null,
    openErrorTitle: "Không thể bắt đầu vòng Thị trường",
    openLabel: "Bắt đầu vòng Thị trường",
    notePlaceholder: "Ví dụ: soi kỹ phần thị trường mục tiêu giúp mình",
    changePlaceholder: "Ví dụ: bổ sung phỏng vấn, đổi khách hàng mục tiêu",
  },
  CP3: {
    sourceBased: true,
    scopes: ["full"],
    answersHint: "Không bắt buộc nếu bạn chấm bằng tài liệu. Nếu dùng, cần đủ số câu có nội dung thật, mỗi câu viết thành câu hoàn chỉnh",
    filesHint: "Không bắt buộc nếu bạn chấm bằng câu trả lời. Mô hình kinh doanh và SWOT dạng .docx, .pdf, .pptx",
    privacyNotice: "Nếu tải lên tệp có thông tin cá nhân (email, số điện thoại, tên người liên hệ), vui lòng xóa hoặc ẩn trước.",
    scopeNote: "Chấm: Mô hình kinh doanh, SWOT, chiến lược và kết luận. Không chấm: sản phẩm thử và giao diện.",
    openErrorTitle: "Không thể bắt đầu vòng Sản phẩm & mô hình",
    openLabel: "Bắt đầu vòng Sản phẩm & mô hình",
    notePlaceholder: "Ví dụ: soi kỹ phần SWOT giúp mình",
    changePlaceholder: "Ví dụ: bổ sung số liệu cho SWOT, sửa phần chi phí",
  },
};

/** Lookup by code string; a code without a grading service (a stage not opened yet) has no entry. */
export function getAuditStageUi(code: string): AuditStageUi | undefined {
  return Object.hasOwn(AUDIT_STAGE_UI, code) ? AUDIT_STAGE_UI[code as AuditCheckpointCode] : undefined;
}

/** True when the stage is graded by choosing answers/files (CP2, CP3). */
export function isSourceBasedStage(code: string): boolean {
  return getAuditStageUi(code)?.sourceBased ?? false;
}

/** Stage a stored report belongs to, from its report type. CP1 reports have many types, so anything unscored is CP1. */
export function reportStageCode(reportType: string | null | undefined): AuditCheckpointCode {
  if (isCp3ReportType(reportType)) return "CP3";
  return isCp2ReportType(reportType) ? "CP2" : "CP1";
}

/** Round-list filter and report-card labels, by stage. */
export const STAGE_ROUND_LABELS: Record<AuditCheckpointCode, string> = {
  CP1: "Vòng Ý tưởng",
  CP2: "Vòng Thị trường",
  CP3: "Vòng Sản phẩm & mô hình",
};
