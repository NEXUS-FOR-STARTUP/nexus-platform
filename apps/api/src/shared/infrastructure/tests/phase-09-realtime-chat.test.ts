import { test } from "node:test";
import assert from "node:assert";
import { randomUUID } from "node:crypto";

process.env.NODE_ENV = "test";

// ---------------------------------------------------------------------------
// Env setup — MUST run before dynamic imports của module đọc env
// ---------------------------------------------------------------------------
// Test secret ≥32 bytes (64 hex chars)
const TEST_SECRET = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
process.env.CENTRIFUGO_TOKEN_SECRET = TEST_SECRET;
process.env.CENTRIFUGO_URL = "http://centrifugo.test:8010";
process.env.CENTRIFUGO_API_KEY = "test-centrifugo-api-key";

// Auth env (để import index.ts/auth.ts không throw) — ??= không đè root .env
process.env.BETTER_AUTH_URL ??= "http://localhost:8000";
process.env.GOOGLE_CLIENT_ID ??= "test-client-id";
process.env.GOOGLE_CLIENT_SECRET ??= "test-client-secret";
// LƯU Ý: KHÔNG set DATABASE_URL default — để env.ts nạp root .env (cwd = apps/api), tránh phá DB test như phase-05

const ORIG_ENV = {
  CENTRIFUGO_TOKEN_SECRET: process.env.CENTRIFUGO_TOKEN_SECRET,
  CENTRIFUGO_URL: process.env.CENTRIFUGO_URL,
  CENTRIFUGO_API_KEY: process.env.CENTRIFUGO_API_KEY,
};
const originalFetch = globalThis.fetch;

const tick = (ms = 30) => new Promise((r) => setTimeout(r, ms));

const COOKIE_NAME = "better-auth.session_token";

function extractSessionCookie(res: any): string {
  const headers = res?.headers;
  let cookies: string[] = [];
  if (headers && typeof headers.getSetCookie === "function") {
    cookies = headers.getSetCookie();
  } else if (headers && typeof headers.get === "function") {
    const raw = headers.get("set-cookie");
    if (raw) cookies = [raw];
  }
  const sc = cookies.find((c) => c.trim().startsWith(`${COOKIE_NAME}=`));
  if (!sc) throw new Error("sign-in response missing session cookie");
  return sc.split(";")[0].trim().slice(COOKIE_NAME.length + 1);
}

async function makeAuthedUser(prisma: any, auth: any, hashPassword: any, role = "user") {
  const uid = randomUUID();
  const email = `${uid}@test.local`;
  const password = "TestPass123!";
  await prisma.user.create({ data: { id: uid, name: "t", email, role } });
  const hashed = await hashPassword(password);
  await prisma.account.create({
    data: {
      id: randomUUID(),
      account_id: uid,
      provider_id: "credential",
      user_id: uid,
      password: hashed,
    },
  });
  const res = await auth.api.signInEmail({ body: { email, password } });
  const cookie = extractSessionCookie(res);
  return { userId: uid, email, cookie };
}

async function createCase(prisma: any, ownerId: string, stage = "submitted") {
  return await prisma.case.create({
    data: {
      case_code: `NX-${randomUUID().slice(0, 8)}`,
      owner_auth_user_id: ownerId,
      user_facing_stage: stage,
      internal_status: "triage_pending",
    },
  });
}

async function seedCredits(prisma: any, caseId: string, balance = 1) {
  await prisma.creditLedger.create({
    data: {
      case_id: caseId,
      amount: balance,
      balance_after: balance,
      type: "purchase",
      idempotency_key: `phase09-${randomUUID()}`,
    },
  });
}

test("Phase 09 - Realtime chat (Centrifugo)", async (t) => {

  let _prisma: any;
  async function getPrisma() {
    if (!_prisma) {
      _prisma = (await import("../../../db.js")).prisma;
    }
    return _prisma;
  }

  const created = {
    users: [] as string[],
    cases: [] as string[],
    messages: [] as string[],
  };

  t.after(async () => {
    // Restore env + fetch
    (Object.keys(ORIG_ENV) as (keyof typeof ORIG_ENV)[]).forEach((k) => {
      const v = ORIG_ENV[k];
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    });
    globalThis.fetch = originalFetch;
    if (!_prisma) return;
    // Clean DB records đã tạo
    if (created.messages.length > 0) {
      await _prisma.caseMessage.deleteMany({ where: { id: { in: created.messages } } });
    }
    if (created.cases.length > 0) {
      await _prisma.creditLedger.deleteMany({ where: { case_id: { in: created.cases } } });
      await _prisma.case.deleteMany({ where: { id: { in: created.cases } } });
    }
    if (created.users.length > 0) {
      await _prisma.session.deleteMany({ where: { user_id: { in: created.users } } });
      await _prisma.account.deleteMany({ where: { user_id: { in: created.users } } });
      await _prisma.user.deleteMany({ where: { id: { in: created.users } } });
    }
    await _prisma.$disconnect();
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

  // ------------------------------------------------------------------
  // Nhóm C — send-message integration (DB thật, mock fetch)
  // ------------------------------------------------------------------
  await t.test("C: send-message publish wire", async () => {
    const prisma = await getPrisma();
    const { sendMessageUseCase } = await import(
      "../../../modules/cases/application/send-message.usecase.js"
    );
    const { AppError } = await import("../../../shared/domain/app-error.js");

    // setup: owner + case + credits
    const ownerId = randomUUID();
    created.users.push(ownerId);
    await prisma.user.create({ data: { id: ownerId, name: "owner", email: `${ownerId}@test.local`, role: "user" } });
    const caseRec = await createCase(prisma, ownerId);
    created.cases.push(caseRec.id);
    await seedCredits(prisma, caseRec.id);

    // C1
    let calls: { url: string; init: any }[] = [];
    globalThis.fetch = async (url: any, init: any) => {
      calls.push({ url, init });
      return new Response(null, { status: 200 });
    };

    const msg = await sendMessageUseCase(ownerId, "user", caseRec.id, "Xin chào supporter");
    assert.ok(msg.id, "message phải có id");
    created.messages.push(msg.id);

    await tick(50);

    const stored = await prisma.caseMessage.findUnique({ where: { id: msg.id } });
    assert.ok(stored, "caseMessage phải tồn tại trong DB");
    assert.strictEqual(stored!.content, "Xin chào supporter");
    assert.strictEqual(stored!.sender_auth_user_id, ownerId);
    assert.strictEqual(stored!.case_id, caseRec.id);

    assert.strictEqual(calls.length, 1, `publish phải gọi 1 lần, gọi ${calls.length}`);
    const c1body = JSON.parse(calls[0].init.body);
    assert.strictEqual(c1body.channel, `chat:${caseRec.id}`);
    assert.strictEqual(c1body.data.type, "message");
    assert.strictEqual(c1body.data.message.id, msg.id);
    assert.strictEqual(c1body.data.message.content, "Xin chào supporter");

    // C2
    const closedCase = await createCase(prisma, ownerId, "completed");
    created.cases.push(closedCase.id);
    await seedCredits(prisma, closedCase.id);

    let c2called = 0;
    globalThis.fetch = async () => {
      c2called++;
      return new Response(null, { status: 200 });
    };

    await assert.rejects(
      () => sendMessageUseCase(ownerId, "user", closedCase.id, "gửi khi đóng"),
      (e: unknown) => e instanceof AppError && e.code === "INVALID_CASE_STAGE",
    );
    await tick(50);
    assert.strictEqual(c2called, 0, "case đóng → publish không được gọi");
  });

  // ------------------------------------------------------------------
  // Nhóm D — subscribe-token authz (HTTP qua app.request, DB thật)
  // ------------------------------------------------------------------
  await t.test("D: subscribe-token HTTP authz", async () => {
    const prisma = await getPrisma();
    const { jwtVerify } = await import("jose");
    const { app } = await import("../../../index.js");
    const { auth } = await import("../../../auth.js");
    const { hashPassword } = await import("better-auth/crypto");

    // setup: owner + outsider + case
    const owner = await makeAuthedUser(prisma, auth, hashPassword, "user");
    const outsider = await makeAuthedUser(prisma, auth, hashPassword, "user");
    created.users.push(owner.userId, outsider.userId);
    const caseRec = await createCase(prisma, owner.userId);
    created.cases.push(caseRec.id);

    const ownerHeaders = { cookie: `${COOKIE_NAME}=${owner.cookie}` };
    const outsiderHeaders = { cookie: `${COOKIE_NAME}=${outsider.cookie}` };

    // D1
    const res1 = await app.request(
      `/api/realtime/cases/${caseRec.id}/subscribe-token`,
      { method: "GET", headers: ownerHeaders },
    );
    assert.strictEqual(res1.status, 200);
    const body1 = await res1.json();
    assert.ok(body1.token, "phải có token");
    const { payload: d1payload } = await jwtVerify(body1.token, new TextEncoder().encode(TEST_SECRET));
    assert.strictEqual(d1payload.channel, `chat:${caseRec.id}`);
    assert.strictEqual(d1payload.sub, owner.userId);

    // D2
    const res2 = await app.request(
      `/api/realtime/cases/${caseRec.id}/subscribe-token`,
      { method: "GET", headers: outsiderHeaders },
    );
    assert.strictEqual(res2.status, 403);

    // D3
    const res3 = await app.request(
      `/api/realtime/cases/${caseRec.id}/subscribe-token`,
      { method: "GET" },
    );
    assert.strictEqual(res3.status, 401);

    // D4
    const res4 = await app.request(
      `/api/realtime/cases/${randomUUID()}/subscribe-token`,
      { method: "GET", headers: ownerHeaders },
    );
    assert.strictEqual(res4.status, 404);
  });
});
