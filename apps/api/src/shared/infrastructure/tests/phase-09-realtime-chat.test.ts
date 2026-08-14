import { test } from "node:test";
import assert from "node:assert";

process.env.NODE_ENV = "test";

// ---------------------------------------------------------------------------
// Env setup — MUST run before dynamic imports của module đọc env
// ---------------------------------------------------------------------------
// Test secret ≥32 bytes (64 hex chars)
const TEST_SECRET = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
process.env.CENTRIFUGO_TOKEN_SECRET = TEST_SECRET;
process.env.CENTRIFUGO_URL = "http://centrifugo.test:8010";
process.env.CENTRIFUGO_API_KEY = "test-centrifugo-api-key";

const ORIG_ENV = {
  CENTRIFUGO_TOKEN_SECRET: process.env.CENTRIFUGO_TOKEN_SECRET,
  CENTRIFUGO_URL: process.env.CENTRIFUGO_URL,
  CENTRIFUGO_API_KEY: process.env.CENTRIFUGO_API_KEY,
};
const originalFetch = globalThis.fetch;

test("Phase 09 - Realtime chat (Centrifugo)", async (t) => {
  t.after(async () => {
    // Restore env + fetch
    (Object.keys(ORIG_ENV) as (keyof typeof ORIG_ENV)[]).forEach((k) => {
      const v = ORIG_ENV[k];
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    });
    globalThis.fetch = originalFetch;
  });

  // ------------------------------------------------------------------
  // Nhóm A — Token (không DB) — dynamic import SAU khi set env
  // ------------------------------------------------------------------
  await t.test("A: token service", async () => {
    const { jwtVerify } = await import("jose");
    const { signConnectionToken, signSubscriptionToken, hasCentrifugoSecret } = await import(
      "../../../modules/realtime/infrastructure/centrifugo-token.service.js"
    );

    // A1
    const token = await signConnectionToken("user-1");
    const { payload: p1 } = await jwtVerify(token, new TextEncoder().encode(TEST_SECRET));
    assert.strictEqual(p1.sub, "user-1");
    const exp1 = p1.exp as number;
    assert.ok(exp1 - Math.floor(Date.now() / 1000) <= 15 * 60 + 5, "exp ≤ 15m + 5s");
    assert.ok(exp1 > Math.floor(Date.now() / 1000), "exp trong tương lai");

    // A2
    const token2 = await signSubscriptionToken("user-1", "case-abc");
    const { payload: p2 } = await jwtVerify(token2, new TextEncoder().encode(TEST_SECRET));
    assert.strictEqual(p2.sub, "user-1");
    assert.strictEqual(p2.channel, "chat:case-abc");
    const exp2 = p2.exp as number;
    assert.ok(exp2 - Math.floor(Date.now() / 1000) <= 15 * 60 + 5, "exp ≤ 15m + 5s");

    // A3
    assert.strictEqual(hasCentrifugoSecret(), true);
  });

  // ------------------------------------------------------------------
  // Nhóm B — publishToChannel (mock fetch, không DB)
  // ------------------------------------------------------------------
  await t.test("B: publishToChannel", async () => {
    const { publishToChannel } = await import(
      "../../../modules/realtime/infrastructure/centrifugo.service.js"
    );

    // B1
    const captured: {
      url?: unknown;
      init?: RequestInit & { body?: string; headers: Record<string, string> };
    } = {};
    globalThis.fetch = async (url: any, init: any) => {
      captured.url = url;
      captured.init = init;
      return new Response(null, { status: 200 });
    };
    const payload = { type: "message", message: { id: "m-1" } };
    const ok = await publishToChannel("chat:case-abc", payload);
    assert.strictEqual(ok, true);
    assert.ok(captured.url, "fetch phải được gọi");
    assert.match(String(captured.url), /\/api\/publish$/);
    assert.strictEqual(captured.init!.method, "POST");
    assert.strictEqual(captured.init!.headers["X-API-Key"], process.env.CENTRIFUGO_API_KEY);
    assert.strictEqual(captured.init!.headers["Content-Type"], "application/json");
    const b1body = JSON.parse(captured.init!.body as string);
    assert.strictEqual(b1body.channel, "chat:case-abc");
    assert.deepStrictEqual(b1body.data, payload);

    // B2
    globalThis.fetch = async () => {
      throw new Error("conn refused");
    };
    const ok2 = await publishToChannel("chat:case-abc", {});
    assert.strictEqual(ok2, false);

    // B3
    const prevKey = process.env.CENTRIFUGO_API_KEY;
    process.env.CENTRIFUGO_API_KEY = "";
    let called = 0;
    globalThis.fetch = async () => {
      called++;
      return new Response(null, { status: 200 });
    };
    try {
      const ok3 = await publishToChannel("chat:case-abc", {});
      assert.strictEqual(ok3, false);
      assert.strictEqual(called, 0, "fetch không được gọi khi thiếu API key");
    } finally {
      process.env.CENTRIFUGO_API_KEY = prevKey;
    }
  });
});
