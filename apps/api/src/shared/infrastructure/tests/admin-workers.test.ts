import { test, describe, after } from "node:test";
import assert from "node:assert/strict";
import { Hono } from "hono";
import { adminRouter } from "../../../modules/admin/http/admin.routes.js";
import { auth } from "../../../auth.js";
import { prisma } from "../../../db.js";
import {
  ompQueue,
  ompQueueEvents,
  redisPublisher,
  redisSubscriber,
} from "../../../modules/ai-engine/infrastructure/queue/omp-queue.js";
import {
  getAdminWorkerStats,
  listAdminWorkerJobs,
  getAdminWorkerJobDetail,
} from "../../../modules/admin/application/admin-workers.service.js";

describe("Admin OMP Worker Monitoring - Smoke & Integration Tests", () => {
  const app = new Hono();
  app.route("/api/admin", adminRouter);

  after(async () => {
    await ompQueue.close().catch(() => {});
    await ompQueueEvents.close().catch(() => {});
    redisSubscriber.disconnect();
    redisPublisher.disconnect();
  });

  test("1. Auth Guard - Bảo mật phân quyền endpoint admin workers", async (t) => {
    const origGetSession = auth.api.getSession;

    try {
      await t.test("từ chối khi không có session (401 Unauthorized)", async () => {
        auth.api.getSession = (async () => null) as unknown as typeof auth.api.getSession;
        const res = await app.request("/api/admin/workers/stats");
        assert.strictEqual(res.status, 401);
        const data = (await res.json()) as { code: string; message: string };
        assert.strictEqual(data.code, "FORBIDDEN");
        assert.match(data.message, /chưa đăng nhập/i);
      });

      await t.test("từ chối khi session là role 'user' (403 Forbidden)", async () => {
        auth.api.getSession = (async () => ({
          user: { id: "user-1", email: "user@test.com", role: "user" },
          session: { id: "sess-1" },
        })) as unknown as typeof auth.api.getSession;
        const res = await app.request("/api/admin/workers/stats");
        assert.strictEqual(res.status, 403);
        const data = (await res.json()) as { code: string; message: string };
        assert.strictEqual(data.code, "FORBIDDEN");
        assert.match(data.message, /không có quyền quản trị/i);
      });

      await t.test("từ chối khi session là role 'supporter' (403 Forbidden)", async () => {
        auth.api.getSession = (async () => ({
          user: { id: "sup-1", email: "supporter@test.com", role: "supporter" },
          session: { id: "sess-2" },
        })) as unknown as typeof auth.api.getSession;
        const res = await app.request("/api/admin/workers/stats");
        assert.strictEqual(res.status, 403);
      });

      await t.test("cho phép truy cập khi session là role 'admin' (200 OK)", async () => {
        auth.api.getSession = (async () => ({
          user: { id: "admin-1", email: "admin@test.com", role: "admin" },
          session: { id: "sess-3" },
        })) as unknown as typeof auth.api.getSession;

        // Stub queue and db for clean 200 response
        const origGetJobCounts = ompQueue.getJobCounts.bind(ompQueue);
        const origCount = prisma.aiJob.count;
        const origFindMany = prisma.aiJob.findMany;

        ompQueue.getJobCounts = (async () => ({
          active: 0,
          waiting: 0,
          completed: 0,
          failed: 0,
          delayed: 0,
          paused: 0,
          prioritized: 0,
        })) as unknown as typeof ompQueue.getJobCounts;
        prisma.aiJob.count = (async () => 0) as unknown as typeof prisma.aiJob.count;
        prisma.aiJob.findMany = (async () => []) as unknown as typeof prisma.aiJob.findMany;

        try {
          const res = await app.request("/api/admin/workers/stats");
          assert.strictEqual(res.status, 200);
          const stats = (await res.json()) as Record<string, unknown>;
          assert.ok(typeof stats === "object" && stats !== null);
          assert.strictEqual(typeof stats.concurrencyLimit, "number");
        } finally {
          ompQueue.getJobCounts = origGetJobCounts;
          prisma.aiJob.count = origCount;
          prisma.aiJob.findMany = origFindMany;
        }
      });
    } finally {
      auth.api.getSession = origGetSession;
    }
  });

  test("2. Stats Logic - getAdminWorkerStats tính toán số liệu chính xác", async () => {
    const origGetJobCounts = ompQueue.getJobCounts.bind(ompQueue);
    const origCount = prisma.aiJob.count;
    const origFindMany = prisma.aiJob.findMany;

    // Stub queue counts: 2 active, 4 waiting
    ompQueue.getJobCounts = (async () => ({
      active: 2,
      waiting: 4,
      completed: 0,
      failed: 0,
      delayed: 0,
      paused: 0,
      prioritized: 0,
    })) as unknown as typeof ompQueue.getJobCounts;

    // Stub prisma.aiJob.count
    let countCallIdx = 0;
    prisma.aiJob.count = (async () => {
      countCallIdx++;
      if (countCallIdx === 1) return 10; // completed24hCount
      if (countCallIdx === 2) return 3;  // failed24hCount
      if (countCallIdx === 3) return 1;  // stuckCount
      return 0;
    }) as unknown as typeof prisma.aiJob.count;

    // Stub completed jobs for avg duration: job1 = 10s, job2 = 20s => avg = 15s (15000ms)
    const baseTime = Date.now() - 3600_000;
    prisma.aiJob.findMany = (async () => [
      {
        created_at: new Date(baseTime),
        updated_at: new Date(baseTime + 10_000),
        input_json: { startedAt: new Date(baseTime).toISOString() },
      },
      {
        created_at: new Date(baseTime),
        updated_at: new Date(baseTime + 20_000),
        input_json: { startedAt: new Date(baseTime).toISOString() },
      },
    ]) as unknown as typeof prisma.aiJob.findMany;

    try {
      const stats = await getAdminWorkerStats();

      assert.strictEqual(typeof stats.concurrencyLimit, "number");
      assert.ok(stats.concurrencyLimit >= 1, "concurrencyLimit phải >= 1");
      assert.strictEqual(stats.activeCount, 2, "activeCount phải bằng 2");
      assert.strictEqual(stats.waitingCount, 4, "waitingCount phải bằng 4");
      assert.strictEqual(stats.completed24hCount, 10, "completed24hCount phải bằng 10");
      assert.strictEqual(stats.failed24hCount, 3, "failed24hCount phải bằng 3");
      assert.strictEqual(stats.stuckCount, 1, "stuckCount phải bằng 1");
      assert.strictEqual(stats.avgDurationMs24h, 15000, "avgDurationMs24h phải bằng trung bình 15000ms");
    } finally {
      ompQueue.getJobCounts = origGetJobCounts;
      prisma.aiJob.count = origCount;
      prisma.aiJob.findMany = origFindMany;
    }
  });

  test("3. List & Filter - listAdminWorkerJobs trả về đúng DTO và phát hiện stuck job", async () => {
    const origCount = prisma.aiJob.count;
    const origFindMany = prisma.aiJob.findMany;

    const elevenMinutesAgo = new Date(Date.now() - 11 * 60 * 1000);
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

    prisma.aiJob.count = (async () => 2) as unknown as typeof prisma.aiJob.count;
    prisma.aiJob.findMany = (async () => [
      {
        id: "job-1",
        case_id: "case-normal",
        status: "processing",
        created_at: twoMinutesAgo,
        updated_at: twoMinutesAgo,
        input_json: {
          submission_type: "initial",
          model: "mimo/mimo-v2.5",
          startedAt: twoMinutesAgo.toISOString(),
        },
        case: {
          id: "case-normal",
          case_code: "NX-NORMAL",
          team_name: "Đội Normal",
          owner: {
            name: "Sinh viên A",
            email: "sva@fpt.edu.vn",
          },
        },
      },
      {
        id: "job-2",
        case_id: "case-stuck",
        status: "processing",
        created_at: elevenMinutesAgo,
        updated_at: elevenMinutesAgo, // > 10 phút => stuck
        input_json: {
          submission_type: "revision",
          model: "google/gemini-2.5-flash",
          startedAt: elevenMinutesAgo.toISOString(),
        },
        case: {
          id: "case-stuck",
          case_code: "NX-STUCK",
          team_name: "Đội Kẹt",
          owner: {
            name: "Sinh viên B",
            email: "svb@fpt.edu.vn",
          },
        },
      },
    ]) as unknown as typeof prisma.aiJob.findMany;

    try {
      const result = await listAdminWorkerJobs({
        page: 1,
        limit: 10,
        status: "all",
        search: "NX-",
      });

      assert.strictEqual(result.total, 2);
      assert.strictEqual(result.page, 1);
      assert.strictEqual(result.limit, 10);
      assert.strictEqual(result.totalPages, 1);
      assert.strictEqual(result.items.length, 2);

      const [item1, item2] = result.items;
      assert.strictEqual(item1.caseCode, "NX-NORMAL");
      assert.strictEqual(item1.isStuck, false, "Job 2 phút không được đánh dấu là kẹt");
      assert.strictEqual(item1.studentName, "Sinh viên A");

      assert.strictEqual(item2.caseCode, "NX-STUCK");
      assert.strictEqual(item2.isStuck, true, "Job > 10 phút đang processing phải đánh dấu là kẹt");
      assert.strictEqual(item2.model, "google/gemini-2.5-flash");
    } finally {
      prisma.aiJob.count = origCount;
      prisma.aiJob.findMany = origFindMany;
    }
  });

  test("4. Detail - getAdminWorkerJobDetail trả về reportSummary với pdfUrl inline endpoint có đuôi .pdf", async () => {
    const origFindFirstAiJob = prisma.aiJob.findFirst;
    const origFindUniqueTeamFit = prisma.teamFitReport.findUnique;
    const origFindFirstReport = prisma.report.findFirst;

    const now = new Date();
    prisma.aiJob.findFirst = (async () => ({
      id: "job-completed-1",
      case_id: "case-completed-1",
      status: "completed",
      job_type: "omp_audit",
      created_at: now,
      updated_at: now,
      input_json: {
        startedAt: now.toISOString(),
        model: "mimo/mimo-v2.5",
        promptMode: "full",
        submission_type: "initial",
      },
      output_json: {},
      case: {
        id: "case-completed-1",
        case_code: "NX-295951",
        team_name: "Startup AI Test",
        owner: {
          id: "user-test",
          name: "Sinh viên Test",
          email: "student@test.com",
        },
      },
    })) as unknown as typeof prisma.aiJob.findFirst;

    prisma.teamFitReport.findUnique = (async () => null) as unknown as typeof prisma.teamFitReport.findUnique;
    prisma.report.findFirst = (async () => ({
      id: "report-123",
      metadata_json: {
        overallScore: 65,
        categoryScores: {
          problemClarity: 70,
          marketViability: 55,
          businessModel: 55,
          competitiveMoat: 50,
          executionFeasibility: 75,
        },
        pdfUrl: "https://res.cloudinary.com/demo/raw/upload/nexus/reports/case-completed-1/audit_report_123456",
      },
      created_at: now,
    })) as unknown as typeof prisma.report.findFirst;

    try {
      const detail = await getAdminWorkerJobDetail("job-completed-1");
      assert.strictEqual(detail.id, "job-completed-1");
      assert.strictEqual(detail.caseCode, "NX-295951");
      assert.ok(detail.reportSummary, "Phải có reportSummary khi report tồn tại");
      assert.strictEqual(detail.reportSummary.id, "report-123");
      assert.strictEqual(detail.reportSummary.overallScore, 65);
      // Invariant: pdfUrl phải trỏ về endpoint API inline download để trình duyệt mở được PDF và tải về có đuôi .pdf
      assert.strictEqual(
        detail.reportSummary.pdfUrl,
        "/api/reports/report-123/download?view=inline",
        "pdfUrl phải là route API inline download, không được là raw Cloudinary URL",
      );
    } finally {
      prisma.aiJob.findFirst = origFindFirstAiJob;
      prisma.teamFitReport.findUnique = origFindUniqueTeamFit;
      prisma.report.findFirst = origFindFirstReport;
    }
  });
  test("5. Independent Runs - Tra cứu theo Job ID (UUID) và hiển thị attemptNo riêng biệt", async () => {
    const origFindFirstAiJob = prisma.aiJob.findFirst;
    const origFindManyAiJob = prisma.aiJob.findMany;
    const origCountAiJob = prisma.aiJob.count;

    const now = new Date();
    const firstRunTime = new Date(Date.now() - 3600_000);
    const secondRunTime = new Date(Date.now() - 1800_000);

    prisma.aiJob.count = (async () => 2) as unknown as typeof prisma.aiJob.count;
    prisma.aiJob.findMany = (async () => [
      {
        id: "550e8400-e29b-41d4-a716-446655440002",
        case_id: "case-dual-run",
        status: "completed",
        created_at: secondRunTime,
        updated_at: secondRunTime,
        input_json: {
          attempt_no: 2,
          submission_type: "logic_check",
          model: "google/gemini-2.5-flash",
        },
        case: {
          id: "case-dual-run",
          case_code: "NX-DUAL",
          team_name: "Đội Chạy Kép",
          owner: { name: "Sinh viên Kép", email: "kep@test.com" },
        },
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440001",
        case_id: "case-dual-run",
        status: "completed",
        created_at: firstRunTime,
        updated_at: firstRunTime,
        input_json: {
          attempt_no: 1,
          submission_type: "initial",
          model: "mimo/mimo-v2.5",
        },
        case: {
          id: "case-dual-run",
          case_code: "NX-DUAL",
          team_name: "Đội Chạy Kép",
          owner: { name: "Sinh viên Kép", email: "kep@test.com" },
        },
      },
    ]) as unknown as typeof prisma.aiJob.findMany;

    prisma.aiJob.findFirst = (async ({ where }: { where?: { OR?: Array<{ id?: string; case_id?: string }> } } = {}) => {
      const searchedId = where?.OR?.[0]?.id;
      if (searchedId === "550e8400-e29b-41d4-a716-446655440002") {
        return {
          id: "550e8400-e29b-41d4-a716-446655440002",
          case_id: "case-dual-run",
          status: "completed",
          created_at: secondRunTime,
          updated_at: secondRunTime,
          input_json: {
            attempt_no: 2,
            submission_type: "logic_check",
            model: "google/gemini-2.5-flash",
          },
          case: {
            id: "case-dual-run",
            case_code: "NX-DUAL",
            team_name: "Đội Chạy Kép",
            owner: { id: "user-kep", name: "Sinh viên Kép", email: "kep@test.com" },
          },
        };
      }
      return null;
    }) as unknown as typeof prisma.aiJob.findFirst;

    try {
      // 1. Kiểm tra list trả về 2 job riêng biệt cho cùng 1 case với attemptNo 1 và 2
      const listResult = await listAdminWorkerJobs({
        page: 1,
        limit: 10,
        status: "all",
        search: "550e8400-e29b-41d4-a716-446655440002",
      });
      assert.strictEqual(listResult.items.length, 2);
      assert.strictEqual(listResult.items[0].id, "550e8400-e29b-41d4-a716-446655440002");
      assert.strictEqual(listResult.items[0].attemptNo, 2);
      assert.strictEqual(listResult.items[0].submissionType, "logic_check");
      assert.strictEqual(listResult.items[1].id, "550e8400-e29b-41d4-a716-446655440001");
      assert.strictEqual(listResult.items[1].attemptNo, 1);
      assert.strictEqual(listResult.items[1].submissionType, "initial");

      // 2. Tra cứu chi tiết theo đúng Job ID UUID
      const detail = await getAdminWorkerJobDetail("550e8400-e29b-41d4-a716-446655440002");
      assert.strictEqual(detail.id, "550e8400-e29b-41d4-a716-446655440002");
      assert.strictEqual(detail.attemptNo, 2);
      assert.strictEqual(detail.submissionType, "logic_check");
      assert.strictEqual(detail.model, "google/gemini-2.5-flash");
    } finally {
      prisma.aiJob.findFirst = origFindFirstAiJob;
      prisma.aiJob.findMany = origFindManyAiJob;
      prisma.aiJob.count = origCountAiJob;
    }
  });
});
