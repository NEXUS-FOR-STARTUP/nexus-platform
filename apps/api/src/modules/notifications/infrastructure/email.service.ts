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
  // Cho phép strong và marker OTP an toàn; mọi HTML khác vẫn bị escape.
  const safeBody = body
    ? escapeHtml(body)
      .replace(/&lt;strong&gt;/g, "<strong>")
      .replace(/&lt;\/strong&gt;/g, "</strong>")
      .replace(
        /&lt;otp&gt;([0-9]{6})&lt;\/otp&gt;/g,
        '<div style="margin:18px 0;text-align:center;font-size:32px;line-height:1;font-weight:800;letter-spacing:0.18em;color:#1a73e8;">$1</div>',
      )
      .replace(/\n/g, "<br/>")
    : "";
  const linkHtml = link
    ? `<div style="margin-top:24px;text-align:center;">
        <a href="https://nexusforstartup.site${escapeHtml(link)}" style="display:inline-block;padding:12px 24px;background-color:#1a73e8;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,0.1);">Xem chi tiết</a>
      </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle}</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f8fafc;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:580px;background-color:#ffffff;border-radius:14px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 6px 12px -2px rgba(0,0,0,0.04);">
          
          <!-- Header with Hosted Official Logo (Centered & Bigger) -->
          <tr>
            <td style="padding:32px 32px 24px 32px;border-bottom:1px solid #f1f5f9;background-color:#ffffff;text-align:center;">
              <img src="https://nexusforstartup.site/logo/Black_Colored.svg" alt="Nexus Logo" style="height:128px;width:auto;display:inline-block;margin:0 auto;border:0;" />
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 16px 0;font-size:20px;font-weight:700;color:#1a73e8;line-height:1.35;letter-spacing:-0.01em;">${safeTitle}</h1>
              
              ${safeBody ? `
              <div style="margin-top:16px;padding:18px 20px;background-color:#f0f7ff;border-left:4px solid #1a73e8;border-radius:0 10px 10px 0;font-size:15px;line-height:1.65;color:#1e293b;">
                ${safeBody}
              </div>` : ""}

              ${linkHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;background-color:#f8fafc;border-top:1px solid #f1f5f9;text-align:center;">
              <p style="margin:0;font-size:12px;line-height:1.5;color:#64748b;">
                Đây là email tự động từ <strong>Nexus Platform</strong>.<br/>Vui lòng không phản hồi trực tiếp qua email này.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
