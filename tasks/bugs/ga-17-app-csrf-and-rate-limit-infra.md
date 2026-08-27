# GA-17: Bảo mật CSRF tầng ứng dụng + Hạ tầng Rate Limit bền vững

- **ID:** GA-17
- **Priority:** P2
- **Category:** Security / Infrastructure
- **Status:** Partially Implemented
- **Nguồn:** `docs/research/mandatory-features-gap-analysis-2026-08-24.md`
- **Tiêu chuẩn:** OWASP Cross-Site Request Forgery & Rate Limiting Cheat Sheets

---

## 1. Mô tả vấn đề
1. **CSRF:** Hệ thống đã cấu hình CORS chặt chẽ (`index.ts:38-54`) và dùng cookie `SameSite: lax` mặc định của Better Auth. Tuy nhiên, chưa có middleware kiểm tra CSRF token hoặc xác minh Origin/Sec-Fetch-Site nghiêm ngặt cho các mutation routes nhạy cảm.
2. **Rate Limit SePay Webhook:** Endpoint `POST /api/payments/webhook` (`sepay.routes.ts:7`) hiện chỉ xác thực bằng API key tĩnh, chưa có rate limit bảo vệ chống spam webhook.
3. **Tính bền vững của Idempotency & Rate Limit:** 
   - `idempotency` trong `index.ts:78` đang sử dụng `memoryStore()`.
   - `message-send-rate-limit.ts` đang lưu Map trong bộ nhớ RAM.
   - Khi server restart hoặc chạy multi-instance (load balancing), toàn bộ trạng thái idempotency và rate limit sẽ bị mất.

## 2. Yêu cầu triển khai (Acceptance Criteria)
1. **CSRF Middleware:**
   - Bổ sung middleware kiểm tra `Origin` / `Referer` khớp với `trustedOrigins` trên tất cả các request POST/PUT/PATCH/DELETE.
2. **Rate Limit Webhook:**
   - Áp dụng rate limit chuyên biệt cho SePay webhook (ví dụ: 30 requests/phút).
3. **Durable Store (Redis / DB / File Cache):**
   - Đóng gói adapter lưu trữ cho Idempotency và Message Rate Limiter để sẵn sàng chuyển đổi từ in-memory sang Redis khi triển khai multi-instance.
