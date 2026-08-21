import type { DomainEvent } from "../../../shared/domain/domain-events.js";

export type RecipientRole = "student" | "supporter" | "admin";

type TemplateFn = (p: Record<string, unknown>) => string;

interface Template {
  title: string;
  studentBody?: TemplateFn;
  supporterBody?: TemplateFn;
  adminBody?: TemplateFn;
  studentLink?: TemplateFn;
  supporterLink?: TemplateFn;
  adminLink?: TemplateFn;
}

const STAGE_LABELS: Record<string, string> = {
  intake_pending: "Chờ thanh toán",
  intake_ready: "Sẵn sàng khởi động",
  submitted: "Đã nộp",
  under_review: "Đang phản biện",
  report_ready: "Báo cáo sẵn sàng",
  need_more_information: "Cần bổ sung",
  revision_submitted: "Đã nộp bản chỉnh sửa",
  waiting_for_revision: "Chờ chỉnh sửa",
  completed: "Hoàn thành",
  rejected: "Bị từ chối",
  closed: "Đã đóng",
};

const fmtAmount = (n: unknown) => {
  const num = typeof n === "number" ? n : Number(n ?? 0);
  return num.toLocaleString("en-US");
};

function payloadText(payload: Record<string, unknown>, key: string, fallback: string): string {
  const value = payload[key];
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

const TEMPLATES: Record<string, Template> = {
  "case.assigned": {
    title: "Case được phân công",
    studentBody: (p) =>
      `Case ${payloadText(p, "caseCode", "chưa xác định")} đã có supporter phụ trách: ${payloadText(p, "supporterName", "chưa xác định")}.`,
    supporterBody: (p) =>
      `Case ${payloadText(p, "caseCode", "chưa xác định")} được giao cho bạn. Supporter phụ trách: ${payloadText(p, "supporterName", "chưa xác định")}.`,
    studentLink: (p) => `/dashboard/case/${p.caseId}`,
    supporterLink: (p) => `/supporter/case/${p.caseId}`,
  },
  "case.approved": {
    title: "Hồ sơ đã được duyệt",
    studentBody: (p) =>
      `Case ${payloadText(p, "caseCode", "chưa xác định")} đã được duyệt và chờ phân công supporter.`,
    studentLink: (p) => `/dashboard/case/${p.caseId}`,
  },
  "case.rejected": {
    title: "Hồ sơ bị từ chối",
    studentBody: (p) =>
      `Case ${payloadText(p, "caseCode", "chưa xác định")} bị từ chối. Lý do: ${payloadText(p, "reason", "chưa xác định")}`,
    studentLink: (p) => `/dashboard/case/${p.caseId}`,
  },
  "payment.proof_uploaded": {
    title: "Minh chứng thanh toán cần duyệt",
    adminBody: (p) =>
      `Case ${payloadText(p, "caseCode", "chưa xác định")} vừa tải minh chứng ${fmtAmount(p.amount)} VND cần kiểm duyệt${
        p.transferContent
          ? `.\nNội dung chuyển khoản: ${p.transferContent}`
          : "."
      }`,
    adminLink: () => `/admin?tab=payments`,
  },
  "payment.verified": {
    title: "Thanh toán đã được duyệt",
    studentBody: (p) =>
      `Thanh toán ${fmtAmount(p.amount)} VND của case ${payloadText(p, "caseCode", "chưa xác định")} đã được xác nhận${p.source === "auto" ? " tự động" : ""}.`,
    studentLink: (p) => `/dashboard/case/${p.caseId}`,
    adminBody: (p) =>
      `Case ${payloadText(p, "caseCode", "chưa xác định")} đã thanh toán ${fmtAmount(p.amount)} VND${p.source === "auto" ? " (tự động)" : ""}. Sẵn sàng duyệt và phân công supporter.`,
    adminLink: () => `/admin?tab=triages`,
  },
  "payment.rejected": {
    title: "Thanh toán bị từ chối",
    studentBody: (p) =>
      `Minh chứng thanh toán case ${payloadText(p, "caseCode", "chưa xác định")} bị từ chối. Lý do: ${payloadText(p, "reason", "chưa xác định")}. Vui lòng tải lại minh chứng.`,
    studentLink: (p) => `/dashboard/case/${p.caseId}`,
  },
  "case.stage_changed": {
    title: "Case cập nhật trạng thái",
    studentBody: (p) => {
      const from = payloadText(p, "fromStage", "chưa xác định");
      const to = payloadText(p, "toStage", "chưa xác định");
      return `Case ${payloadText(p, "caseCode", "chưa xác định")} chuyển từ '${STAGE_LABELS[from] ?? from}' sang '${STAGE_LABELS[to] ?? to}'.`;
    },
    supporterBody: (p) => {
      const to = payloadText(p, "toStage", "chưa xác định");
      return `Case ${payloadText(p, "caseCode", "chưa xác định")} đổi trạng thái sang '${STAGE_LABELS[to] ?? to}'.`;
    },
    studentLink: (p) => `/dashboard/case/${p.caseId}`,
    supporterLink: (p) => `/supporter/case/${p.caseId}`,
  },
  "report.published": {
    title: "Báo cáo đã sẵn sàng",
    studentBody: (p) =>
      `Báo cáo phản biện của case ${payloadText(p, "caseCode", "chưa xác định")} đã sẵn sàng. Xem ngay!`,
    studentLink: (p) => `/dashboard/case/${p.caseId}`,
  },
  "request_more_info": {
    title: "Cần bổ sung thông tin",
    studentBody: (p) =>
      `Case ${payloadText(p, "caseCode", "chưa xác định")} cần bổ sung: ${payloadText(p, "query", "chưa xác định")}`,
    studentLink: (p) => `/dashboard/case/${p.caseId}`,
  },
  "deposit.verified": {
    title: "Nạp tiền thành công",
    studentBody: (p: any) => `+${p.amount.toLocaleString("en-US")} VND đã vào ví của bạn`,
    studentLink: (p: any) => `/dashboard/wallet`,
  },
  "deposit.rejected": {
    title: "Nạp tiền bị từ chối",
    studentBody: (p: any) => `Giao dịch ${p.amount.toLocaleString("en-US")} VND không được duyệt`,
    studentLink: (p: any) => `/dashboard/wallet`,
  },
  "order.paid": {
    title: "Mua credit thành công",
    studentBody: (p: any) => `Đã mua ${p.totalCredits || 0} credit. Tổng: ${(p.totalAmount || 0).toLocaleString("en-US")} VND`,
    studentLink: (p: any) => `/dashboard/wallet`,
  },
  "order.refunded": {
    title: "Hoàn tiền credit",
    studentBody: (p: any) => `Đã hoàn ${p.amount.toLocaleString("en-US")} VND vào ví`,
    studentLink: (p: any) => `/dashboard/wallet`,
  },
  "wallet.balance_changed": {
    title: "Số dư ví thay đổi",
    studentBody: (p) => `Số dư ví của bạn hiện tại: ${fmtAmount(p.balanceAfter)} VND${p.referenceType ? ` (${p.referenceType})` : ""}.`,
    studentLink: (p) => `/dashboard/wallet`,
  },
};

export function renderTemplate(
  type: string,
  payload: Record<string, unknown>,
  role: RecipientRole,
): { title: string; body: string | null; link: string | null } {
  const t = TEMPLATES[type];
  if (!t) {
    return { title: type, body: null, link: null };
  }
  const bodyFn = role === "student" ? t.studentBody : role === "supporter" ? t.supporterBody : t.adminBody;
  const linkFn = role === "student" ? t.studentLink : role === "supporter" ? t.supporterLink : t.adminLink;
  return {
    title: t.title,
    body: bodyFn ? bodyFn(payload) : null,
    link: linkFn ? linkFn(payload) : null,
  };
}
