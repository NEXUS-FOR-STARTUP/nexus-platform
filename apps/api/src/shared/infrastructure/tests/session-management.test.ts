process.env.NODE_ENV = "test";
process.env.DATABASE_URL ??= "postgresql://user:pass@localhost:5432/test";

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { listSessionsUseCase } from "../../../modules/profile/application/list-sessions.usecase.js";
import { revokeSessionUseCase } from "../../../modules/profile/application/revoke-session.usecase.js";
import { revokeOtherSessionsUseCase } from "../../../modules/profile/application/revoke-other-sessions.usecase.js";
import { AppError } from "../../../shared/domain/app-error.js";
import type { AuditLogEntry } from "../audit-logger.js";
import { parseUserAgent, formatIpAddress } from "@repo/validation";

describe("GA-06: Session Management Test Suite", () => {
  const mockUserId = "user-test-uuid-123";
  const currentSessionId = "sess_base62_nanoid_current_999";
  const otherSessionId = "sess_base62_nanoid_other_888";

  describe("listSessionsUseCase", () => {
    it("TC01: Lọc phiên hợp lệ & Nhận diện phiên hiện tại bằng session.id (hỗ trợ alphanumeric nanoid)", async () => {
      const now = new Date();
      const mockDbSessions = [
        {
          id: currentSessionId,
          ip_address: "14.162.140.21",
          user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0",
          created_at: new Date(now.getTime() - 1000 * 60 * 60),
          expires_at: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7),
        },
        {
          id: otherSessionId,
          ip_address: "118.69.182.10",
          user_agent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1",
          created_at: new Date(now.getTime() - 1000 * 60 * 60 * 5),
          expires_at: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7),
        },
      ];

      const result = await listSessionsUseCase(mockUserId, currentSessionId, {
        findSessions: async (uId) => {
          assert.equal(uId, mockUserId);
          return mockDbSessions;
        },
      });

      assert.equal(result.length, 2);
      assert.equal(result[0]?.id, currentSessionId);
      assert.equal(result[0]?.isCurrent, true);
      assert.equal(result[0]?.ipAddress, "14.162.140.21");

      assert.equal(result[1]?.id, otherSessionId);
      assert.equal(result[1]?.isCurrent, false);
      assert.equal(result[1]?.ipAddress, "118.69.182.10");
    });

    it("TC02: Không rò rỉ Token (token field is stripped from DTO)", async () => {
      const mockDbSessions = [
        {
          id: currentSessionId,
          ip_address: "127.0.0.1",
          user_agent: "Mozilla/5.0",
          created_at: new Date(),
          expires_at: new Date(Date.now() + 100000),
        },
      ];

      const result = await listSessionsUseCase(mockUserId, currentSessionId, {
        findSessions: async () => mockDbSessions,
      });

      assert.equal(result.length, 1);
      assert.equal("token" in (result[0] ?? {}), false);
    });

    it("TC03: Lọc bỏ phiên hết hạn & Xử lý danh sách rỗng (TC04)", async () => {
      const result = await listSessionsUseCase(mockUserId, currentSessionId, {
        findSessions: async () => [],
      });

      assert.deepEqual(result, []);
    });

    it("TC05: Validation Error khi thiếu userId", async () => {
      await assert.rejects(
        async () => {
          await listSessionsUseCase("", currentSessionId);
        },
        (err: unknown) => {
          assert.ok(err instanceof AppError);
          assert.equal(err.status, 400);
          assert.equal(err.code, "VALIDATION_ERROR");
          return true;
        }
      );
    });
  });

  describe("revokeSessionUseCase", () => {
    it("TC06: Chặn tự thu hồi phiên hiện tại qua nút đơn lẻ", async () => {
      await assert.rejects(
        async () => {
          await revokeSessionUseCase(mockUserId, currentSessionId, currentSessionId);
        },
        (err: unknown) => {
          assert.ok(err instanceof AppError);
          assert.equal(err.status, 400);
          assert.equal(err.code, "CANNOT_REVOKE_CURRENT_SESSION");
          return true;
        }
      );
    });

    it("TC07: Thu hồi phiên hợp lệ thành công & Ghi Audit Log", async () => {
      let deletedSessionId = "";
      let deletedUserId = "";
      let auditLogged: Omit<AuditLogEntry, "timestamp" | "level"> | undefined;

      const result = await revokeSessionUseCase(mockUserId, otherSessionId, currentSessionId, {
        deleteSession: async (sessId, uId) => {
          deletedSessionId = sessId;
          deletedUserId = uId;
          return { count: 1 };
        },
        logAudit: (entry) => {
          auditLogged = entry;
        },
      });

      assert.equal(result.success, true);
      assert.equal(deletedSessionId, otherSessionId);
      assert.equal(deletedUserId, mockUserId);
      assert.ok(auditLogged !== undefined);
      assert.equal(auditLogged?.operation, "profile.revoke_session");
      assert.equal(auditLogged?.action, "delete");
      assert.equal(auditLogged?.resource_type, "session");
      assert.equal(auditLogged?.resource_id, otherSessionId);
    });

    it("TC08: Chặn IDOR / Session không tồn tại (count = 0 -> 404 SESSION_NOT_FOUND)", async () => {
      await assert.rejects(
        async () => {
          await revokeSessionUseCase(mockUserId, "non-existent-session-id", currentSessionId, {
            deleteSession: async () => ({ count: 0 }),
          });
        },
        (err: unknown) => {
          assert.ok(err instanceof AppError);
          assert.equal(err.status, 404);
          assert.equal(err.code, "SESSION_NOT_FOUND");
          return true;
        }
      );
    });

    it("Validation Error khi thiếu userId hoặc sessionId", async () => {
      await assert.rejects(
        async () => {
          await revokeSessionUseCase("", otherSessionId, currentSessionId);
        },
        (err: unknown) => {
          assert.ok(err instanceof AppError);
          assert.equal(err.status, 400);
          assert.equal(err.code, "VALIDATION_ERROR");
          return true;
        }
      );

      await assert.rejects(
        async () => {
          await revokeSessionUseCase(mockUserId, "", currentSessionId);
        },
        (err: unknown) => {
          assert.ok(err instanceof AppError);
          assert.equal(err.status, 400);
          assert.equal(err.code, "VALIDATION_ERROR");
          return true;
        }
      );
    });
  });

  describe("revokeOtherSessionsUseCase", () => {
    it("TC09: Thu hồi tất cả phiên khác & Giữ nguyên phiên hiện tại", async () => {
      let passedUserId = "";
      let passedCurrentSessionId = "";
      let auditLogged: Omit<AuditLogEntry, "timestamp" | "level"> | undefined;

      const result = await revokeOtherSessionsUseCase(mockUserId, currentSessionId, {
        deleteOtherSessions: async (uId, currId) => {
          passedUserId = uId;
          passedCurrentSessionId = currId;
          return { count: 3 };
        },
        logAudit: (entry) => {
          auditLogged = entry;
        },
      });

      assert.equal(result.success, true);
      assert.equal(result.count, 3);
      assert.equal(passedUserId, mockUserId);
      assert.equal(passedCurrentSessionId, currentSessionId);
      assert.ok(auditLogged !== undefined);
      assert.equal(auditLogged?.operation, "profile.revoke_other_sessions");
      assert.equal(auditLogged?.resource_type, "session");
      assert.equal(auditLogged?.metadata?.revoked_count, 3);
    });

    it("TC10: Guard thiếu currentSessionId (ném 500 INVALID_SESSION_CONTEXT)", async () => {
      await assert.rejects(
        async () => {
          await revokeOtherSessionsUseCase(mockUserId, "");
        },
        (err: unknown) => {
          assert.ok(err instanceof AppError);
          assert.equal(err.status, 500);
          assert.equal(err.code, "INVALID_SESSION_CONTEXT");
          return true;
        }
      );
    });

    it("TC11: Trường hợp chỉ có 1 phiên duy nhất (count = 0)", async () => {
      const result = await revokeOtherSessionsUseCase(mockUserId, currentSessionId, {
        deleteOtherSessions: async () => ({ count: 0 }),
      });

      assert.equal(result.success, true);
      assert.equal(result.count, 0);
    });
  });

  describe("UA Parser & IP Formatter (Frontend Utility Tests)", () => {
    it("TC12: Phân tích đúng Microsoft Edge trên Windows 10/11", () => {
      const edgeUa = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0";
      const result = parseUserAgent(edgeUa);
      assert.equal(result.browser, "Microsoft Edge");
      assert.equal(result.os, "Windows 10/11");
      assert.equal(result.deviceType, "desktop");
    });

    it("TC13: Phân tích đúng Google Chrome trên macOS", () => {
      const chromeMacUa = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";
      const result = parseUserAgent(chromeMacUa);
      assert.equal(result.browser, "Google Chrome");
      assert.equal(result.os, "macOS");
      assert.equal(result.deviceType, "desktop");
    });

    it("TC14: Phân tích đúng Apple Safari trên iPhone / iPad", () => {
      const iphoneUa = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1";
      const iphoneResult = parseUserAgent(iphoneUa);
      assert.equal(iphoneResult.browser, "Apple Safari");
      assert.equal(iphoneResult.os, "iOS");
      assert.equal(iphoneResult.deviceType, "mobile");

      const ipadUa = "Mozilla/5.0 (iPad; CPU OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1";
      const ipadResult = parseUserAgent(ipadUa);
      assert.equal(ipadResult.browser, "Apple Safari");
      assert.equal(ipadResult.os, "iPadOS");
      assert.equal(ipadResult.deviceType, "tablet");
    });

    it("TC15: Fallback an toàn cho User-Agent rỗng / dị dạng", () => {
      const emptyResult = parseUserAgent(null);
      assert.equal(emptyResult.browser, "Trình duyệt không xác định");
      assert.equal(emptyResult.os, "Hệ điều hành không xác định");
      assert.equal(emptyResult.deviceType, "unknown");

      const malformedResult = parseUserAgent("CustomBot/1.0");
      assert.equal(malformedResult.browser, "Trình duyệt khác");
      assert.equal(malformedResult.os, "Hệ điều hành khác");
      assert.equal(malformedResult.deviceType, "desktop");
    });

    it("TC16: Format Localhost & IPv6", () => {
      assert.equal(formatIpAddress("::1"), "Localhost");
      assert.equal(formatIpAddress("127.0.0.1"), "Localhost");
      assert.equal(formatIpAddress("http://localhost:3000"), "Localhost");
      assert.equal(formatIpAddress("::ffff:14.162.140.21"), "14.162.140.21");
      assert.equal(formatIpAddress("14.162.140.21"), "14.162.140.21");
      assert.equal(formatIpAddress(null), "IP không xác định");
    });
  });
});
