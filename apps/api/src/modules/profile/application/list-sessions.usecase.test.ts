import test from "node:test";
import assert from "node:assert/strict";
import { listSessionsUseCase } from "./list-sessions.usecase.js";

test("listSessionsUseCase - returns actual ip_address from DB (no fallback)", async () => {
  const fakeSessions = [
    {
      id: "sess-1",
      ip_address: "",
      user_agent: "Mozilla/5.0",
      created_at: new Date("2026-08-26T07:56:00Z"),
      expires_at: new Date("2026-09-02T07:56:00Z"),
    },
    {
      id: "sess-2",
      ip_address: null,
      user_agent: "Mozilla/5.0",
      created_at: new Date("2026-08-26T07:57:00Z"),
      expires_at: new Date("2026-09-02T07:57:00Z"),
    },
    {
      id: "sess-3",
      ip_address: "171.233.24.67",
      user_agent: "Mozilla/5.0",
      created_at: new Date("2026-08-26T07:58:00Z"),
      expires_at: new Date("2026-09-02T07:58:00Z"),
    },
  ];

  const result = await listSessionsUseCase("user-1", "sess-1", {
    findSessions: async () => fakeSessions,
  });

  assert.equal(result.length, 3);
  assert.equal(result[0].ipAddress, "");       // empty string from DB, no fallback
  assert.equal(result[0].isCurrent, true);
  assert.equal(result[1].ipAddress, null);      // null from DB, no fallback
  assert.equal(result[1].isCurrent, false);
  assert.equal(result[2].ipAddress, "171.233.24.67");
});
