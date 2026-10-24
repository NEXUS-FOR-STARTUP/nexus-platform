import { type Icon } from "@phosphor-icons/react";
import { FolderPlus, UploadSimple as Upload, CheckCircle, XCircle, NotePencil as FileEdit, FileText as FileCheck, Question as HelpCircle, Circle, UserCheck, Chat as MessageSquare, Trash as Trash2, Coins, ArrowUpRight, ArrowCounterClockwise as RotateCcw, PlayCircle, WarningCircle, Prohibit, ArrowUUpLeft, GearSix, FileArrowDown, FolderOpen, FileArrowUp } from "@phosphor-icons/react/ssr";

export interface EventDetails {
  label: string;
  desc: string;
  icon: Icon;
  colorClass: string;
}

type EventMetadata = Record<string, unknown>;

const CHECKPOINT_LABELS: Record<string, string> = { CP1: "Ý tưởng", CP2: "Thị trường", CP3: "Mô hình kinh doanh" };
const AUDIT_FAIL_REASONS: Record<string, string> = {
  "worker-failed": "Hệ thống chấm gặp lỗi",
  "finalize-no-output": "Hệ thống chấm không trả kết quả",
  "finalize-error": "Không lưu được báo cáo",
  "dispatch-failure": "Không khởi động được tiến trình chấm",
  "stale-job-cleanup": "Tiến trình chấm bị treo quá lâu",
  "stale-watchdog-cleanup": "Tiến trình chấm bị treo quá lâu",
  "admin-healed-stuck": "Quản trị viên xử lý tiến trình bị kẹt",
  "cancelled-by-user": "Bạn đã hủy",
  case_closed: "Dự án được đóng",
  admin_veto: "Dự án bị từ chối",
};

const str = (v: unknown): string | undefined => (typeof v === "string" && v.trim() ? v : undefined);
const num = (v: unknown): number | undefined => (typeof v === "number" && Number.isFinite(v) ? v : undefined);
const stage = (meta: EventMetadata) => {
  const code = str(meta.checkpoint) ?? str(meta.checkpoint_code);
  return code ? (CHECKPOINT_LABELS[code] ?? code) : undefined;
};
const vnd = (n: number) => `${n.toLocaleString("vi-VN")}đ`;

/** Descriptions that depend on what the event stored; absent metadata falls back to the static text. */
const DESCRIBE: Record<string, (meta: EventMetadata) => string | undefined> = {
  audit_started: (m) => {
    const s = stage(m);
    return `Bắt đầu chấm giai đoạn${s ? ` ${s}` : ""}${m.credit_charged === false ? "." : ", đã trừ 1 lượt chấm."}`;
  },
  audit_completed: (m) => {
    const s = stage(m);
    return `Báo cáo chấm${s ? ` giai đoạn ${s}` : ""} đã sẵn sàng.`;
  },
  audit_failed: (m) => {
    const r = AUDIT_FAIL_REASONS[str(m.reason) ?? ""];
    return `Lượt chấm không hoàn thành${r ? `: ${r}` : ""}.`;
  },
  audit_cancelled: () => "Bạn đã hủy lượt chấm đang chạy.",
  credit_refunded: (m) => {
    const credits = num(m.credits) ?? 0;
    const money = num(m.refund_vnd) ?? 0;
    const r = AUDIT_FAIL_REASONS[str(m.reason) ?? ""];
    const parts = [credits > 0 ? `${credits} lượt chấm` : undefined, money > 0 ? vnd(money) : undefined].filter(Boolean);
    return `${parts.length ? `Đã hoàn ${parts.join(" và ")}` : "Đã hoàn lại"}${r ? ` (${r})` : ""}.`;
  },
  credits_purchased: (m) => {
    const q = num(m.quantity);
    const paid = num(m.amount_vnd);
    return q ? `Đã thêm ${q} lượt chấm${paid ? ` (${vnd(paid)})` : ""}.` : undefined;
  },
  stage_opened: (m) => {
    const s = stage(m);
    return s ? `Đã mở giai đoạn ${s}.` : undefined;
  },
  stage_documents_uploaded: (m) => {
    const n = num(m.file_count);
    const s = stage(m);
    const names = Array.isArray(m.file_names) ? m.file_names.filter((x): x is string => typeof x === "string") : [];
    return `Đã tải ${n ?? names.length} tài liệu${s ? ` vào giai đoạn ${s}` : ""}${names.length ? `: ${names.slice(0, 3).join(", ")}${names.length > 3 ? "…" : ""}` : ""}.`;
  },
  stage_document_deleted: (m) => {
    const name = str(m.file_name);
    return `Đã xóa tài liệu${name ? ` ${name}` : ""}.`;
  },
  case_settings_updated: (m) => {
    const labels: Record<string, string> = { team_name: "tên dự án", school: "trường", course_context: "môn học", group_no: "nhóm", contact: "thông tin liên hệ", idea: "ý tưởng", current_blocker: "vướng mắc", support_needs: "nhu cầu hỗ trợ" };
    const fields = Array.isArray(m.fields) ? m.fields.filter((x): x is string => typeof x === "string").map((x) => labels[x] ?? x) : [];
    return fields.length ? `Đã cập nhật ${fields.join(", ")}.` : undefined;
  },
  guided_docx_exported: (m) => {
    const title = str(m.document_title);
    return `Đã xuất tài liệu${title ? ` “${title}”` : ""} ra Word.`;
  },
  guided_proposal_imported: (m) => {
    const name = str(m.file_name);
    return `Đã nhập nội dung từ tệp${name ? ` ${name}` : ""} vào biểu mẫu.`;
  },
};

const EVENT_MAP: Record<string, EventDetails> = {
  case_created: {
    label: "Khởi tạo hồ sơ",
    desc: "Hồ sơ phản biện đã được khởi tạo trên hệ thống.",
    icon: FolderPlus,
    colorClass: "bg-brand-soft text-brand border-brand/20",
  },
  case_created_event: {
    label: "Khởi tạo hồ sơ",
    desc: "Hồ sơ phản biện đã được khởi tạo trên hệ thống.",
    icon: FolderPlus,
    colorClass: "bg-brand-soft text-brand border-brand/20",
  },
  case_submitted: {
    label: "Tạo dự án",
    desc: "Dự án đã được tạo trên hệ thống.",
    icon: Upload,
    colorClass: "bg-brand-soft text-brand border-brand/20",
  },
  case_accepted: {
    label: "Hồ sơ được duyệt",
    desc: "Hồ sơ đã được chấp nhận.",
    icon: CheckCircle,
    colorClass: "bg-success-soft text-success border-success/20",
  },
  case_rejected: {
    label: "Hồ sơ bị từ chối",
    desc: "Hồ sơ không được chấp nhận phê duyệt.",
    icon: XCircle,
    colorClass: "bg-danger-soft text-danger border-danger/20",
  },
  case_resubmitted: {
    label: "Nộp lại hồ sơ",
    desc: "Hồ sơ đã được nộp lại sau khi chỉnh sửa.",
    icon: Upload,
    colorClass: "bg-brand-soft text-brand border-brand/20",
  },
  supporter_assigned: {
    label: "Đã phân công người hỗ trợ",
    desc: "Người hỗ trợ đã được phân công để đánh giá và phản biện hồ sơ.",
    icon: UserCheck,
    colorClass: "bg-info-soft text-info border-info/20",
  },
  more_info_requested: {
    label: "Yêu cầu bổ sung thông tin",
    desc: "Yêu cầu cập nhật hoặc làm rõ thêm thông tin hồ sơ.",
    icon: HelpCircle,
    colorClass: "bg-warning-soft text-warning border-warning/20",
  },
  revision_submitted: {
    label: "Đã nộp bản sửa đổi",
    desc: "Bản sửa đổi hồ sơ đã được nộp thành công.",
    icon: Upload,
    colorClass: "bg-info-soft text-info border-info/20",
  },
  revision_recalled: {
    label: "Bản sửa đổi đã được thu hồi",
    desc: "Bản sửa đổi đã được thu hồi và không còn hiệu lực.",
    icon: XCircle,
    colorClass: "bg-danger-soft text-danger border-danger/20",
  },
  message_sent: {
    label: "Tin nhắn mới",
    desc: "Tin nhắn trao đổi mới đã được gửi trong phần thảo luận.",
    icon: MessageSquare,
    colorClass: "bg-surface-soft text-text-muted border-border-app",
  },
  payment_submitted: {
    label: "Nộp minh chứng thanh toán",
    desc: "Minh chứng chuyển khoản ngân hàng được tải lên hệ thống.",
    icon: Upload,
    colorClass: "bg-warning-soft text-warning border-warning/20",
  },
  payment_proof_uploaded: {
    label: "Nộp minh chứng thanh toán",
    desc: "Minh chứng chuyển khoản ngân hàng được tải lên hệ thống.",
    icon: Upload,
    colorClass: "bg-warning-soft text-warning border-warning/20",
  },
  payment_approved: {
    label: "Thanh toán thành công",
    desc: "Giao dịch thanh toán được xác nhận hợp lệ bởi quản trị viên.",
    icon: CheckCircle,
    colorClass: "bg-success-soft text-success border-success/20",
  },
  payment_verified: {
    label: "Thanh toán thành công",
    desc: "Giao dịch thanh toán được xác nhận hợp lệ bởi quản trị viên.",
    icon: CheckCircle,
    colorClass: "bg-success-soft text-success border-success/20",
  },
  payment_rejected: {
    label: "Thanh toán bị từ chối",
    desc: "Minh chứng giao dịch bị từ chối do thông tin không khớp.",
    icon: XCircle,
    colorClass: "bg-danger-soft text-danger border-danger/20",
  },
  report_draft_created: {
    label: "Tạo bản nháp phản biện AI",
    desc: "Bản thảo báo cáo phản biện AI được tạo lập tự động.",
    icon: FileEdit,
    colorClass: "bg-info-soft text-info border-info/20",
  },
  report_approved: {
    label: "Báo cáo chính thức",
    desc: "Báo cáo phản biện được kiểm duyệt và gửi tới sinh viên.",
    icon: FileCheck,
    colorClass: "bg-success-soft text-success border-success/20",
  },
  report_sent: {
    label: "Báo cáo chính thức",
    desc: "Báo cáo phản biện được kiểm duyệt và gửi tới sinh viên.",
    icon: FileCheck,
    colorClass: "bg-success-soft text-success border-success/20",
  },
  clarification_requested: {
    label: "Yêu cầu làm rõ",
    desc: "Supporter yêu cầu nhóm bổ sung hoặc giải trình về nội dung hồ sơ.",
    icon: HelpCircle,
    colorClass: "bg-warning-soft text-warning border-warning/20",
  },
  need_clarification: {
    label: "Yêu cầu làm rõ",
    desc: "Supporter yêu cầu nhóm bổ sung hoặc giải trình về nội dung hồ sơ.",
    icon: HelpCircle,
    colorClass: "bg-warning-soft text-warning border-warning/20",
  },
  supporter_output_uploaded: {
    label: "Tải lên tài liệu hỗ trợ",
    desc: "Tài liệu kết quả đã được tải lên.",
    icon: FileCheck,
    colorClass: "bg-success-soft text-success border-success/20",
  },
  external_feedback_uploaded: {
    label: "Đánh giá bên ngoài",
    desc: "Tài liệu đánh giá của chuyên gia/giảng viên bên ngoài đã được tải lên.",
    icon: Upload,
    colorClass: "bg-info-soft text-info border-info/20",
  },
  credits_purchased: {
    label: "Mua credit",
    desc: "Credit đã được nạp thành công vào tài khoản hồ sơ này.",
    icon: Coins,
    colorClass: "bg-success-soft text-success border-success/20",
  },
  credit_used: {
    label: "Đã dùng credit",
    desc: "Một lượt chấm đã được sử dụng.",
    icon: ArrowUpRight,
    colorClass: "bg-brand-soft text-brand border-brand/20",
  },
  document_deleted: {
    label: "Xóa tài liệu",
    desc: "Tài liệu đã được gỡ bỏ khỏi hệ thống bởi quản trị viên.",
    icon: Trash2,
    colorClass: "bg-danger-soft text-danger border-danger/20",
  },
  intake_submitted: {
    label: "Đã gửi thông tin hồ sơ",
    desc: "Thông tin hồ sơ khởi tạo đã được gửi lên hệ thống thành công.",
    icon: Upload,
    colorClass: "bg-brand-soft text-brand border-brand/20",
  },
  case_completed: {
    label: "Hồ sơ hoàn thành",
    desc: "Quy trình phản biện cho hồ sơ đã hoàn tất.",
    icon: CheckCircle,
    colorClass: "bg-success-soft text-success border-success/20",
  },
  vetoed: {
    label: "Hồ sơ bị từ chối",
    desc: "Hồ sơ đã bị quản trị viên từ chối và đóng lại.",
    icon: XCircle,
    colorClass: "bg-danger-soft text-danger border-danger/20",
  },
  package_upgraded: {
    label: "Nâng cấp gói dịch vụ",
    desc: "Gói dịch vụ của hồ sơ đã được nâng cấp thành công.",
    icon: ArrowUpRight,
    colorClass: "bg-brand-soft text-brand border-brand/20",
  },

  audit_started: {
    label: "Bắt đầu chấm",
    desc: "Lượt chấm mới đã bắt đầu.",
    icon: PlayCircle,
    colorClass: "bg-brand-soft text-brand border-brand/20",
  },
  audit_completed: {
    label: "Đã có báo cáo chấm",
    desc: "Báo cáo chấm đã sẵn sàng.",
    icon: FileCheck,
    colorClass: "bg-success-soft text-success border-success/20",
  },
  audit_failed: {
    label: "Lượt chấm không hoàn thành",
    desc: "Lượt chấm gặp sự cố.",
    icon: WarningCircle,
    colorClass: "bg-danger-soft text-danger border-danger/20",
  },
  audit_cancelled: {
    label: "Đã hủy lượt chấm",
    desc: "Lượt chấm đang chạy đã bị hủy.",
    icon: Prohibit,
    colorClass: "bg-warning-soft text-warning border-warning/20",
  },
  credit_refunded: {
    label: "Hoàn lượt chấm",
    desc: "Đã hoàn lại cho bạn.",
    icon: ArrowUUpLeft,
    colorClass: "bg-success-soft text-success border-success/20",
  },
  stage_opened: {
    label: "Mở giai đoạn",
    desc: "Đã mở một giai đoạn mới của hành trình.",
    icon: FolderOpen,
    colorClass: "bg-brand-soft text-brand border-brand/20",
  },
  stage_documents_uploaded: {
    label: "Tải tài liệu lên",
    desc: "Đã tải tài liệu lên giai đoạn.",
    icon: FileArrowUp,
    colorClass: "bg-brand-soft text-brand border-brand/20",
  },
  stage_document_deleted: {
    label: "Xóa tài liệu",
    desc: "Đã xóa một tài liệu đã tải lên.",
    icon: Trash2,
    colorClass: "bg-surface-soft text-text-muted border-border-app",
  },
  case_settings_updated: {
    label: "Cập nhật dự án",
    desc: "Thông tin dự án đã được cập nhật.",
    icon: GearSix,
    colorClass: "bg-surface-soft text-text-muted border-border-app",
  },
  answers_saved: {
    label: "Soạn câu trả lời",
    desc: "Đã lưu câu trả lời trong biểu mẫu.",
    icon: FileEdit,
    colorClass: "bg-surface-soft text-text-muted border-border-app",
  },
  guided_docx_exported: {
    label: "Xuất tài liệu Word",
    desc: "Đã xuất biểu mẫu ra tệp Word.",
    icon: FileArrowDown,
    colorClass: "bg-brand-soft text-brand border-brand/20",
  },
  guided_proposal_imported: {
    label: "Nhập từ tệp",
    desc: "Đã nhập nội dung từ tệp vào biểu mẫu.",
    icon: Upload,
    colorClass: "bg-brand-soft text-brand border-brand/20",
  },

  // ── Transition-name events (stored by case-transition.service.ts) ──
  T1_CREATE_CASE: {
    label: "Khởi tạo hồ sơ",
    desc: "Hồ sơ đề án phản biện đã được khởi tạo trên hệ thống.",
    icon: FolderPlus,
    colorClass: "bg-brand-soft text-brand border-brand/20",
  },
  T2_SUBMIT_INTAKE: {
    label: "Nộp hồ sơ đề án",
    desc: "Sinh viên đã hoàn thành và gửi hồ sơ đề án lên hệ thống.",
    icon: Upload,
    colorClass: "bg-brand-soft text-brand border-brand/20",
  },
  T3_RESUBMIT_AFTER_REJECT: {
    label: "Nộp lại hồ sơ sau từ chối",
    desc: "Hồ sơ đã được chỉnh sửa và nộp lại sau khi bị từ chối.",
    icon: Upload,
    colorClass: "bg-brand-soft text-brand border-brand/20",
  },
  T4_RESUBMIT_AFTER_VETO: {
    label: "Nộp lại hồ sơ sau xem xét",
    desc: "Hồ sơ đã được cập nhật và nộp lại sau khi xem xét yêu cầu.",
    icon: Upload,
    colorClass: "bg-brand-soft text-brand border-brand/20",
  },
  T7_START_WORK: {
    label: "Bắt đầu phản biện",
    desc: "Người hỗ trợ đã tiếp nhận và bắt đầu xem xét, phản biện hồ sơ.",
    icon: FileEdit,
    colorClass: "bg-info-soft text-info border-info/20",
  },
  T10_START_REVIEW_REVISION: {
    label: "Bắt đầu xem xét bản sửa đổi",
    desc: "Người hỗ trợ đang tiến hành xem xét và đánh giá bản sửa đổi hồ sơ.",
    icon: FileEdit,
    colorClass: "bg-info-soft text-info border-info/20",
  },
  T16_EDIT_INTAKE: {
    label: "Chỉnh sửa hồ sơ đề án",
    desc: "Thông tin hồ sơ đề án đã được cập nhật.",
    icon: FileEdit,
    colorClass: "bg-brand-soft text-brand border-brand/20",
  },
  T14_COMPLETE: {
    label: "Hồ sơ hoàn thành (Admin)",
    desc: "Quản trị viên đã đóng và hoàn thành hồ sơ phản biện.",
    icon: CheckCircle,
    colorClass: "bg-success-soft text-success border-success/20",
  },
  T17_USER_CONFIRM_COMPLETE: {
    label: "Xác nhận hoàn thành",
    desc: "Sinh viên xác nhận hồ sơ đã hoàn tất và đóng quy trình đánh giá.",
    icon: CheckCircle,
    colorClass: "bg-success-soft text-success border-success/20",
  },
  T19_REOPEN: {
    label: "Mở lại hồ sơ",
    desc: "Hồ sơ đã được mở lại để tiếp tục quy trình phản biện.",
    icon: ArrowUpRight,
    colorClass: "bg-info-soft text-info border-info/20",
  },
  T15_CANCEL: {
    label: "Hồ sơ đã hủy",
    desc: "Sinh viên đã hủy hồ sơ phản biện.",
    icon: XCircle,
    colorClass: "bg-danger-soft text-danger border-danger/20",
  },
  T12_REJECT: {
    label: "Hồ sơ bị từ chối",
    desc: "Hồ sơ không đạt yêu cầu và bị từ chối bởi quản trị viên.",
    icon: XCircle,
    colorClass: "bg-danger-soft text-danger border-danger/20",
  },
  T8_REQUEST_INFO: {
    label: "Yêu cầu bổ sung thông tin",
    desc: "Yêu cầu cập nhật hoặc làm rõ thêm thông tin hồ sơ.",
    icon: HelpCircle,
    colorClass: "bg-warning-soft text-warning border-warning/20",
  },
  T6_ASSIGN_SUPPORTER: {
    label: "Đã phân công người hỗ trợ",
    desc: "Người hỗ trợ đã được phân công để đánh giá và phản biện hồ sơ.",
    icon: UserCheck,
    colorClass: "bg-info-soft text-info border-info/20",
  },
  T5_ACCEPT: {
    label: "Hồ sơ được duyệt",
    desc: "Hồ sơ đã được quản trị viên duyệt và chấp nhận.",
    icon: CheckCircle,
    colorClass: "bg-success-soft text-success border-success/20",
  },
  T9_SUBMIT_REVISION: {
    label: "Đã nộp bản sửa đổi",
    desc: "Bản sửa đổi hồ sơ đã được nộp thành công.",
    icon: Upload,
    colorClass: "bg-info-soft text-info border-info/20",
  },
  T11_SUBMIT_OUTPUT: {
    label: "Tải lên tài liệu hỗ trợ",
    desc: "Tài liệu kết quả đã được tải lên.",
    icon: FileCheck,
    colorClass: "bg-success-soft text-success border-success/20",
  },
  T13_VETO: {
    label: "Hồ sơ bị từ chối",
    desc: "Hồ sơ đã bị quản trị viên từ chối và đóng lại.",
    icon: XCircle,
    colorClass: "bg-danger-soft text-danger border-danger/20",
  },

  // ── Admin Worker Actions ──
  ADMIN_RETRY_AI_JOB: {
    label: "Kích hoạt chạy lại AI (Admin)",
    desc: "Quản trị viên đã kích hoạt chạy lại tiến trình thẩm định AI cho hồ sơ.",
    icon: RotateCcw,
    colorClass: "bg-brand-soft text-brand border-brand/20",
  },
  ADMIN_HEALED_STUCK_JOB: {
    label: "Giải cứu tiến trình AI kẹt (Admin)",
    desc: "Quản trị viên đã giải phóng tiến trình AI bị kẹt và chuyển hồ sơ về trạng thái an toàn.",
    icon: CheckCircle,
    colorClass: "bg-warning-soft text-warning border-warning/20",
  },
  ADMIN_CANCEL_AI_JOB: {
    label: "Hủy tiến trình AI (Admin)",
    desc: "Quản trị viên đã hủy tiến trình thẩm định AI đang chạy.",
    icon: XCircle,
    colorClass: "bg-danger-soft text-danger border-danger/20",
  },
};

const FALLBACK: EventDetails = {
  label: "",
  desc: "Sự kiện hệ thống ghi nhận.",
  icon: Circle,
  colorClass: "bg-surface-soft text-text-muted border-border-app",
};

export function getEventDetails(type: string, metadata?: unknown): EventDetails {
  const base = resolveEventDetails(type);
  const meta = metadata && typeof metadata === "object" ? (metadata as EventMetadata) : null;
  const desc = meta ? DESCRIBE[type]?.(meta) : undefined;
  return desc ? { ...base, desc } : base;
}

function resolveEventDetails(type: string): EventDetails {
  return (
    EVENT_MAP[type] ?? {
      ...FALLBACK,
      label: type
        .replace(/^T\d+_/, "")
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/^\w/, (c) => c.toUpperCase()),
    }
  );
}
