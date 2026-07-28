import {
  FolderPlus,
  Upload,
  CheckCircle,
  XCircle,
  FileEdit,
  FileCheck,
  HelpCircle,
  Circle,
  UserCheck,
  MessageSquare,
  Trash2,
  Coins,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react";

export interface EventDetails {
  label: string;
  desc: string;
  icon: LucideIcon;
  colorClass: string;
}

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
    label: "Hồ sơ đã nộp",
    desc: "Hồ sơ phản biện đã được gửi lên hệ thống thành công và đang chờ xét duyệt.",
    icon: Upload,
    colorClass: "bg-brand-soft text-brand border-brand/20",
  },
  case_accepted: {
    label: "Hồ sơ được duyệt",
    desc: "Hồ sơ đã được quản trị viên duyệt và chấp nhận.",
    icon: CheckCircle,
    colorClass: "bg-success-soft text-success border-success/20",
  },
  case_rejected: {
    label: "Hồ sơ bị từ chối",
    desc: "Hồ sơ không được chấp nhận phê duyệt.",
    icon: XCircle,
    colorClass: "bg-danger-soft text-danger border-danger/20",
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
    desc: "Tài liệu đầu ra hỗ trợ (supporter output) đã được tải lên.",
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
    desc: "Một lượt credit đã được sử dụng cho đánh giá từ Supporter.",
    icon: ArrowUpRight,
    colorClass: "bg-brand-soft text-brand border-brand/20",
  },
  document_deleted: {
    label: "Xóa tài liệu",
    desc: "Tài liệu đã được gỡ bỏ khỏi hệ thống bởi quản trị viên.",
    icon: Trash2,
    colorClass: "bg-danger-soft text-danger border-danger/20",
  },
};

const FALLBACK: EventDetails = {
  label: "",
  desc: "Sự kiện hệ thống ghi nhận.",
  icon: Circle,
  colorClass: "bg-surface-soft text-text-muted border-border-app",
};

export function getEventDetails(type: string): EventDetails {
  return EVENT_MAP[type] ?? {
    ...FALLBACK,
    label: type.replace(/_/g, " "),
  };
}
