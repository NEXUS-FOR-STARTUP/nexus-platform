import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

process.env.NODE_ENV = "test";

import { Hono } from "hono";
import { auth } from "../../../auth.js";
import { prisma } from "../../../db.js";
import { receivablesAdminRouter } from "../../../modules/receivables/http/receivables.routes.js";

const app = new Hono();
app.route("/", receivablesAdminRouter);

const OPERATOR = { id: "op-1", email: "team@nexus.test", name: "Đội ngũ Nexus" };
const saved = { session: auth.api.getSession, userFirst: prisma.user.findFirst, recMany: prisma.receivable.findMany };
let sessionUserId: string | null = null;

beforeEach(() => {
  sessionUserId = null;
  process.env["RECEIVABLE_SYSTEM_USER_EMAIL"] = OPERATOR.email;
  Reflect.set(auth.api, "getSession", async () => (sessionUserId ? { user: { id: sessionUserId, role: "admin" } } : null));
  Reflect.set(prisma.user, "findFirst", async () => OPERATOR);
  Reflect.set(prisma.receivable, "findMany", async () => []);
});

afterEach(() => {
  Reflect.set(auth.api, "getSession", saved.session);
  Reflect.set(prisma.user, "findFirst", saved.userFirst);
  Reflect.set(prisma.receivable, "findMany", saved.recMany);
  delete process.env["RECEIVABLE_SYSTEM_USER_EMAIL"];
});

const post = () =>
  app.request("/", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });

test("receivables admin routes only serve the configured system account", async (t) => {
  await t.test("unauthenticated is 401 on /system-account and 401-class on list/create", async () => {
    assert.equal((await app.request("/system-account")).status, 401);
    assert.equal((await app.request("/")).status, 401);
    assert.equal((await post()).status, 401);
  });

  await t.test("a logged-in admin who is not the system account is 403 and /system-account is null", async () => {
    sessionUserId = "other-admin";
    assert.equal((await app.request("/")).status, 403);
    assert.equal((await post()).status, 403);
    const res = await app.request("/system-account");
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { ok: true, data: null });
  });

  await t.test("the configured account lists (200) and sees itself on /system-account", async () => {
    sessionUserId = OPERATOR.id;
    const list = await app.request("/");
    assert.equal(list.status, 200);
    assert.equal(((await list.json()) as { data: { total: number } }).data.total, 0);
    const res = await app.request("/system-account");
    assert.deepEqual(await res.json(), { ok: true, data: OPERATOR });
  });

  await t.test("operator passing the guard gets validation 400 on an empty create body", async () => {
    sessionUserId = OPERATOR.id;
    assert.equal((await post()).status, 400);
  });

  await t.test("no configured system account is 403 for everyone", async () => {
    sessionUserId = OPERATOR.id;
    Reflect.set(prisma.user, "findFirst", async () => null);
    assert.equal((await app.request("/")).status, 403);
  });
});
