import { prisma } from "../../../db.js";
import { DOMAIN_EVENTS, type DomainEvent } from "../../../shared/domain/domain-events.js";
import type { RecipientRole } from "./notification-templates.js";

export interface Recipient {
  userId: string;
  email: string;
  role: RecipientRole;
  /** telegram chat id theo role — resolve lúc fan-out */
  telegramChatId?: string;
}

const TELEGRAM_ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;
const TELEGRAM_SUPPORTER_CHAT_ID = process.env.TELEGRAM_SUPPORTER_CHAT_ID;

const STUDENT_EVENTS: Set<string> = new Set([
  DOMAIN_EVENTS.CASE_ASSIGNED,
  DOMAIN_EVENTS.CASE_APPROVED,
  DOMAIN_EVENTS.CASE_REJECTED,
  DOMAIN_EVENTS.PAYMENT_VERIFIED,
  DOMAIN_EVENTS.PAYMENT_REJECTED,
  DOMAIN_EVENTS.CASE_STAGE_CHANGED,
  DOMAIN_EVENTS.REPORT_PUBLISHED,
  DOMAIN_EVENTS.REQUEST_MORE_INFO,
]);

const ADMIN_EVENTS: Set<string> = new Set([DOMAIN_EVENTS.PAYMENT_PROOF_UPLOADED]);

async function fetchCaseStudents(caseId: string): Promise<Recipient[]> {
  // Query riêng — không đụng findCaseByIdWithMembers (dùng chung, select khác)
  const caseRecord = await prisma.case.findUnique({
    where: { id: caseId },
    select: {
      owner: { select: { id: true, email: true } },
      members: {
        select: {
          auth_user_id: true,
          user: { select: { id: true, email: true } },
        },
      },
    },
  });
  if (!caseRecord) return [];

  const seen = new Set<string>();
  const result: Recipient[] = [];
  const push = (id: string, email: string) => {
    if (seen.has(id)) return;
    seen.add(id);
    result.push({ userId: id, email, role: "student" });
  };

  push(caseRecord.owner.id, caseRecord.owner.email);
  for (const m of caseRecord.members) push(m.auth_user_id, m.user.email);
  return result;
}

async function fetchAdmins(): Promise<Recipient[]> {
  const admins = await prisma.user.findMany({
    where: { role: "admin" },
    select: { id: true, email: true },
  });
  return admins.map((a) => ({ userId: a.id, email: a.email, role: "admin" }));
}

export async function resolveRecipients(event: DomainEvent): Promise<Recipient[]> {
  const payload = event.payload as Record<string, unknown>;
  const caseId = typeof payload.caseId === "string" ? payload.caseId : null;

  let recipients: Recipient[] = [];

  if (ADMIN_EVENTS.has(event.type)) {
    recipients = await fetchAdmins();
  } else if (STUDENT_EVENTS.has(event.type) && caseId) {
    recipients = await fetchCaseStudents(caseId);
    // case.assigned → supporter cũng nhận (không qua DB — từ payload)
    if (event.type === DOMAIN_EVENTS.CASE_ASSIGNED) {
      const supporterId = payload.supporterId;
      if (typeof supporterId === "string" && supporterId) {
        recipients.push({
          userId: supporterId,
          email: "",
          role: "supporter",
          telegramChatId: TELEGRAM_SUPPORTER_CHAT_ID || undefined,
        });
      }
    }
  } else {
    return [];
  }

  // Skip actor — người thực hiện không nhận của chính mình (trừ system actor null)
  if (event.actorId) {
    recipients = recipients.filter((r) => r.userId !== event.actorId);
  }

  // Telegram chat id cho admin
  if (TELEGRAM_ADMIN_CHAT_ID) {
    recipients = recipients.map((r) =>
      r.role === "admin" ? { ...r, telegramChatId: TELEGRAM_ADMIN_CHAT_ID } : r,
    );
  }

  return recipients;
}

/** Channel mapping — email budget Resend free 100/ngày; stage_changed + auto-verified in-app thay thế */
export function channelsFor(type: string, role: RecipientRole, payload: Record<string, unknown> = {}): string[] {
  const chans: string[] = ["in_app"];

  const studentEmail: Set<string> = new Set([
    DOMAIN_EVENTS.CASE_ASSIGNED,
    DOMAIN_EVENTS.CASE_APPROVED,
    DOMAIN_EVENTS.CASE_REJECTED,
    DOMAIN_EVENTS.PAYMENT_VERIFIED,
    DOMAIN_EVENTS.PAYMENT_REJECTED,
    DOMAIN_EVENTS.REPORT_PUBLISHED,
    DOMAIN_EVENTS.REQUEST_MORE_INFO,
  ]);

  if (role === "student") {
    // auto-verified (sepay) → in_app only — student tự thanh toán biết rồi
    const isAutoVerified =
      type === DOMAIN_EVENTS.PAYMENT_VERIFIED && payload.source === "auto";
    if (studentEmail.has(type) && !isAutoVerified) chans.push("email");
  } else if (role === "supporter") {
    if (type === DOMAIN_EVENTS.CASE_ASSIGNED) chans.push("telegram");
  } else if (role === "admin") {
    if (type === DOMAIN_EVENTS.PAYMENT_PROOF_UPLOADED) chans.push("telegram");
  }

  return chans;
}
