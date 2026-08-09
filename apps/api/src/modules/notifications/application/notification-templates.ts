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
  return num.toLocaleString("vi-VN");
};

const TEMPLATES: Record<string, Template> = {
  "case.assigned": {
    title: "Case được phân công",
    studentBody: (p) => `Case ${p.caseCode} đã có supporter phụ trách: ${p.supporterName}.`,
    supporterBody: (p) => `Case ${p.caseCode} được giao cho bạn.`,
    studentLink: (p) => `/dashboard/case/${p.caseId}`,
    supporterLink: (p) => `/supporter/case/${p.caseId}`,
  },
  "case.approved": {
    title: "Hồ sơ đã được duyệt",
    studentBody: (p) => `Case ${p.caseCode} đã được duyệt và chờ phân công supporter.`,
    studentLink: (p) => `/dashboard/case/${p.caseId}`,
  },
  "case.rejected": {
    title: "Hồ sơ bị từ chối",
    studentBody: (p) => `Case ${p.caseCode} bị từ chối. Lý do: ${p.reason}`,
    studentLink: (p) => `/dashboard/case/${p.caseId}`,
  },
  "payment.proof_uploaded": {
    title: "Minh chứng thanh toán cần duyệt",
    adminBody: (p) =>
      `Case ${p.caseCode} vừa tải minh chứng ${fmtAmount(p.amount)} VND cần kiểm duyệt${
        p.transferContent
          ? `.\nNội dung chuyển khoản: ${p.transferContent}`
          : "."
      }`,
    adminLink: () => `/admin?tab=payments`,
  },
  "payment.verified": {
    title: "Thanh toán đã được duyệt",
    studentBody: (p) =>
      `Thanh toán ${fmtAmount(p.amount)} VND của case ${p.caseCode} đã được xác nhận${p.source === "auto" ? " tự động" : ""}.`,
    studentLink: (p) => `/dashboard/case/${p.caseId}`,
    adminBody: (p) =>
      `Case ${p.caseCode} đã thanh toán ${fmtAmount(p.amount)} VND${p.source === "auto" ? " (tự động)" : ""}. Sẵn sàng duyệt và phân công supporter.`,
    adminLink: () => `/admin?tab=triages`,
  },
  "payment.rejected": {
    title: "Thanh toán bị từ chối",
    studentBody: (p) =>
      `Minh chứng thanh toán case ${p.caseCode} bị từ chối. Lý do: ${p.reason}. Vui lòng tải lại minh chứng.`,
    studentLink: (p) => `/dashboard/case/${p.caseId}`,
  },
  "case.stage_changed": {
    title: "Case cập nhật trạng thái",
    studentBody: (p) =>
      `Case ${p.caseCode} chuyển từ '${STAGE_LABELS[p.fromStage as string] ?? p.fromStage}' sang '${STAGE_LABELS[p.toStage as string] ?? p.toStage}'.`,
    supporterBody: (p) =>
      `Case ${p.caseCode} đổi trạng thái sang '${STAGE_LABELS[p.toStage as string] ?? p.toStage}'.`,
    studentLink: (p) => `/dashboard/case/${p.caseId}`,
    supporterLink: (p) => `/supporter/case/${p.caseId}`,
  },
  "report.published": {
    title: "Báo cáo đã sẵn sàng",
    studentBody: (p) => `Báo cáo phản biện của case ${p.caseCode} đã sẵn sàng. Xem ngay!`,
    studentLink: (p) => `/dashboard/case/${p.caseId}`,
  },
  "request_more_info": {
    title: "Cần bổ sung thông tin",
    studentBody: (p) => `Case ${p.caseCode} cần bổ sung: ${p.query}`,
    studentLink: (p) => `/dashboard/case/${p.caseId}`,
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
