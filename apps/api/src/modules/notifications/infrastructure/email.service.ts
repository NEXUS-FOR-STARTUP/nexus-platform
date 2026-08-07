import { Resend } from "resend";
import logger from "../../../shared/infrastructure/logger.js";

// Optional init — thiếu RESEND_API_KEY → disabled + log warning (không crash)
export class EmailService {
  private resend: Resend | null = null;

  constructor() {
    const key = process.env.RESEND_API_KEY;
    if (key) {
      this.resend = new Resend(key);
    } else {
      logger.warn("RESEND_API_KEY missing — email notifications disabled");
    }
  }

  async send(to: string, subject: string, html: string, idempotencyKey: string): Promise<void> {
    if (!this.resend) return;
    await this.resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "Nexus Platform <noreply@nexusforstartup.site>",
      to,
      subject,
      html,
      headers: { "Idempotency-Key": idempotencyKey }, // retry cùng outbox.id → Resend dedupe, không gửi trùng
    });
  }
}

export const emailService = new EmailService();

// SECURITY (audit 2026-08-07): body chứa user input (reason/query/supporterName)
// → escapeHtml() trước khi nội suy vào HTML. Chống HTML injection / email-client XSS.
export const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (ch) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!,
  );

export function renderEmailHtml(title: string, body: string | null, link: string | null): string {
  const safeTitle = escapeHtml(title);
  const safeBody = body ? escapeHtml(body).replace(/\n/g, "<br/>") : "";
  const linkHtml = link
    ? `<p><a href="https://nexusforstartup.site${escapeHtml(link)}" style="display:inline-block;padding:10px 18px;background-color:#1a73e8;color:#ffffff;text-decoration:none;border-radius:6px;">Xem chi tiết</a></p>`
    : "";
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333333">
<h2 style="color:#1a73e8;margin:0 0 12px;">Nexus Platform</h2>
<p><strong>${safeTitle}</strong></p>
${safeBody ? `<p>${safeBody}</p>` : ""}
${linkHtml}
<p style="color:#888888;font-size:12px;margin-top:24px;">Bạn nhận được email này vì có hoạt động mới trên Nexus Platform.</p>
</div>`;
}
