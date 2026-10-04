import { test } from "node:test";
import assert from "node:assert";
import type { ServicePackage } from "@prisma/client";
import type {
  TeamFitFreeReport,
  TeamFitLegacyFreeReport,
  TeamFitSavedResult,
  TeamMemberInput,
} from "@repo/validation";

process.env.NODE_ENV = "test";

// Shared test fixtures
const validIdea = {
  projectName: "GreenEats",
  field: "Food & Sustainability",
  targetCustomer: "Người tiêu dùng quan tâm sức khỏe, 18-35 tuổi",
  problem: "Người tiêu dùng khó tiếp cận thực phẩm organic giá phải chăng",
  solution: "Nền tảng kết nối nông dân organic với người tiêu dùng qua giao hàng tận nơi",
  mvp: "Website đặt hàng đơn giản với 5 nông dân hợp tác đầu tiên",
};

const validTeam: TeamMemberInput[] = [
  {
    roleTrack: "ky_thuat",
    major: "Software Engineering",
    strengths: ["React", "Node.js", "UI/UX Design"],
    experience: ["Đã build 2 website e-commerce trong môn SWP391"],
  },
  {
    roleTrack: "kinh_doanh_tai_chinh",
    major: "Business Administration",
    strengths: ["Market Research", "Financial Planning"],
    experience: ["Thực tập tại công ty F&B 3 tháng"],
  },
];

const validResult: TeamFitFreeReport = {
  version: 2,
  machineStats: {
    distinctMajors: 2,
    trackCoverage: { ky_thuat: 1, marketing: 0, kinh_doanh_tai_chinh: 1 },
    experiencedCount: 2,
    emptyFields: [],
  },
  ai: {
    verdict: "can_can_nhac",
    areas: [
      {
        ten: "Kỹ thuật sản phẩm",
        trangThai: "on",
        mucDo: "cao",
        lyDo: "Nhóm có người dựng được website đặt hàng",
        danChung: "Đã build 2 website e-commerce trong môn SWP391",
      },
      {
        ten: "Vận hành chuỗi lạnh",
        trangThai: "yeu",
        mucDo: "cao",
        lyDo: "Giao nông sản tươi cần người hiểu vận hành",
        danChung: "Chưa thành viên nào ghi kinh nghiệm vận hành",
      },
    ],
    industryRoles: [
      { vaiTro: "Lập trình viên", conThieu: false, lyDo: "Có thành viên Software Engineering" },
      { vaiTro: "Vận hành chuỗi cung ứng", conThieu: true, lyDo: "Không ai ghi kinh nghiệm vận hành" },
    ],
    committeeQuestions: [
      "Nông sản được bảo quản lạnh bằng cách nào?",
      "Chi phí giao hàng mỗi đơn là bao nhiêu?",
      "Ai chịu trách nhiệm vận hành kho?",
      "Nhóm đã khảo sát bao nhiêu khách hàng?",
      "Nếu một nông dân rời hợp tác thì xử lý thế nào?",
    ],
  },
  handoff: [
    { cauHoi: "Giải pháp của nhóm có khả thi không?", canNopGi: "Bản mô tả giải pháp hoặc đề cương dự án" },
    { cauHoi: "Mô hình kinh doanh có hợp lý không?", canNopGi: "Bảng chi phí, giá bán và dự phóng doanh thu" },
    { cauHoi: "Khách hàng thật có cần sản phẩm này không?", canNopGi: "Kết quả khảo sát hoặc phỏng vấn khách hàng" },
    { cauHoi: "Kỹ thuật có làm được không?", canNopGi: "Mô tả kiến trúc và phân công công việc trong nhóm" },
  ],
};

// Shape stored on cases saved before the v2 report existed.
const legacyResult: TeamFitLegacyFreeReport = {
  teamGaps: ["Thiếu chuyên môn về logistics và chuỗi cung ứng lạnh"],
  commercialGaps: ["Chưa có chiến lược định giá rõ ràng", "Phân khúc khách hàng quá rộng"],
};

const freePkg = {
  id: "pkg_tf_free",
  name: "Team-Fit Free",
  price: 0,
  is_active: true,
  features: ["Đánh giá cơ bản"],
};

const auditPkg = {
  id: "pkg_tf_audit",
  name: "Team-Fit Audit",
  price: 39000,
  is_active: true,
  features: ["Đánh giá chuyên sâu"],
};

const inactivePkg = {
  id: "pkg_inactive",
  name: "Inactive",
  price: 0,
  is_active: false,
  features: [],
};

test("TeamFit evaluate — machine stats + AI-fail fallback", async (t) => {
  const { computeMachineStats, evaluateTeamFitUseCase } = await import(
    "../../../modules/ai-engine/application/evaluate-team-fit.usecase.js"
  );

  await t.test("đếm đúng ngành/mảng/kinh nghiệm/ô trống", () => {
    const stats = computeMachineStats({
      idea: { ...validIdea, mvp: "   " },
      team: [
        { roleTrack: "ky_thuat", major: " Software Engineering ", strengths: ["React"], experience: ["a"] },
        { roleTrack: "ky_thuat", major: "software engineering", strengths: [], experience: ["  "] },
        { major: "Marketing", strengths: [], experience: [] } as never,
      ],
    });
    assert.strictEqual(stats.distinctMajors, 2);
    assert.deepStrictEqual(stats.trackCoverage, { ky_thuat: 2, marketing: 0, kinh_doanh_tai_chinh: 0 });
    assert.strictEqual(stats.experiencedCount, 1);
    assert.ok(stats.emptyFields.includes("MVP"));
    assert.ok(stats.emptyFields.includes("Thành viên 3: Mảng nghề"));
  });

  await t.test("AI lỗi vẫn trả machineStats + handoff", async () => {
    const report = await evaluateTeamFitUseCase({ idea: validIdea, team: validTeam });
    assert.strictEqual(report.version, 2);
    assert.strictEqual(report.machineStats.distinctMajors, 2);
    assert.strictEqual(report.handoff.length, 4);
    assert.strictEqual(report.ai, null);
  });
});

test("TeamFit save — union chặn payload lạ, nhận 2 dạng hợp lệ", async (t) => {
  const { TeamFitSaveBodySchema } = await import("../../../modules/ai-engine/http/ai-engine.routes.js");

  await t.test("chặn result không thuộc dạng nào", () => {
    const parsed = TeamFitSaveBodySchema.safeParse({ idea: validIdea, team: validTeam, result: { version: 2 } });
    assert.strictEqual(parsed.success, false);
  });

  await t.test("nhận dạng mới và dạng cũ", () => {
    assert.strictEqual(
      TeamFitSaveBodySchema.safeParse({ idea: validIdea, team: validTeam, result: validResult }).success,
      true,
    );
    assert.strictEqual(
      TeamFitSaveBodySchema.safeParse({ idea: validIdea, team: validTeam, result: legacyResult }).success,
      true,
    );
  });

  await t.test("server tính lại machineStats — client bịa distinctMajors: 99 bị ghi đè", async () => {
    const { saveTeamFitUseCase } = await import(
      "../../../modules/ai-engine/application/save-team-fit.usecase.js"
    );

    const spoofed = {
      ...validResult,
      machineStats: { ...validResult.machineStats, distinctMajors: 99 },
    };
    let storedResult = null as unknown as TeamFitSavedResult;

    await saveTeamFitUseCase(
      { idea: validIdea, team: validTeam, result: spoofed, userId: "user-1" },
      {
        findPackageById: async () => freePkg as unknown as ServicePackage,
        findTeamFitReportsByOwner: async () => [],
        findCaseByCode: async () => null,
        createCaseAndReport: async (data) => {
          storedResult = data.result;
          return { id: "case-spoof", case_code: data.caseCode };
        },
      },
    );

    assert.strictEqual((storedResult as TeamFitFreeReport).machineStats.distinctMajors, 2);
  });
});

test("Wave 1 Todo 8 - Team-Fit Save", async (t) => {
  await t.test("rejects when package not found", async () => {
    const { saveTeamFitUseCase } = await import(
      "../../../modules/ai-engine/application/save-team-fit.usecase.js"
    );
    const { AppError } = await import("../../domain/app-error.js");

    try {
      await saveTeamFitUseCase(
        { idea: validIdea, team: validTeam, result: validResult, userId: "user-1" },
        {
          findPackageById: async () => null,
          findTeamFitReportsByOwner: async () => [],
          findCaseByCode: async () => null,
          createCaseAndReport: async () => {
            throw new Error("Should not create case");
          },
        },
      );
      assert.fail("Should throw");
    } catch (err) {
      assert.ok(err instanceof AppError);
      assert.strictEqual(err.code, "PACKAGE_NOT_FOUND");
      assert.strictEqual(err.status, 400);
    }
  });

  await t.test("rejects when package is inactive", async () => {
    const { saveTeamFitUseCase } = await import(
      "../../../modules/ai-engine/application/save-team-fit.usecase.js"
    );
    const { AppError } = await import("../../domain/app-error.js");

    try {
      await saveTeamFitUseCase(
        { idea: validIdea, team: validTeam, result: validResult, userId: "user-1" },
        {
          findPackageById: async () => inactivePkg as any,
          findTeamFitReportsByOwner: async () => [],
          findCaseByCode: async () => null,
          createCaseAndReport: async () => {
            throw new Error("Should not create case");
          },
        },
      );
      assert.fail("Should throw");
    } catch (err) {
      assert.ok(err instanceof AppError);
      assert.strictEqual(err.code, "PACKAGE_NOT_FOUND");
    }
  });

  await t.test("returns existing case on duplicate idea+team (idempotency)", async () => {
    const { saveTeamFitUseCase } = await import(
      "../../../modules/ai-engine/application/save-team-fit.usecase.js"
    );

    const existingReport = {
      id: "report-1",
      case_id: "case-1",
      idea_snapshot: validIdea,
      team_snapshot: validTeam,
      case: { id: "case-1", case_code: "NX-123456" },
    };

    const output = await saveTeamFitUseCase(
      { idea: validIdea, team: validTeam, result: validResult, userId: "user-1" },
      {
        findPackageById: async () => freePkg as any,
        findTeamFitReportsByOwner: async () => [existingReport],
        findCaseByCode: async () => null,
        createCaseAndReport: async () => {
          throw new Error("Should not create case for duplicate");
        },
      },
    );

    assert.strictEqual(output.caseId, "case-1");
    assert.strictEqual(output.caseCode, "NX-123456");
    assert.strictEqual(output.isNew, false);
  });

  await t.test("creates case + report successfully with free package (default)", async () => {
    const { saveTeamFitUseCase } = await import(
      "../../../modules/ai-engine/application/save-team-fit.usecase.js"
    );

    let createdCaseData: any = null;

    const output = await saveTeamFitUseCase(
      { idea: validIdea, team: validTeam, result: validResult, userId: "user-1" },
      {
        findPackageById: async (id) => {
          assert.strictEqual(id, "pkg_tf_free"); // defaults when no packageId
          return freePkg as any;
        },
        findTeamFitReportsByOwner: async () => [],
        findCaseByCode: async () => null,
        createCaseAndReport: async (data) => {
          createdCaseData = data;
          return { id: "case-new", case_code: data.caseCode };
        },
      },
    );

    assert.strictEqual(output.isNew, true);
    assert.ok(output.caseId);
    assert.ok(output.caseCode.startsWith("NX-"));

    // Verify case data
    assert.strictEqual(createdCaseData.ownerId, "user-1");
    assert.strictEqual(createdCaseData.teamName, validIdea.projectName);
    assert.strictEqual(createdCaseData.packageId, "pkg_tf_free");
    assert.strictEqual(createdCaseData.lockedPrice, 0);
    assert.strictEqual(createdCaseData.isFree, true);
    assert.deepStrictEqual(createdCaseData.idea, validIdea);
    assert.deepStrictEqual(createdCaseData.team, validTeam);
    assert.deepStrictEqual(createdCaseData.result, validResult);
  });

  await t.test("still saves a legacy result shape (teamGaps/commercialGaps)", async () => {
    const { saveTeamFitUseCase } = await import(
      "../../../modules/ai-engine/application/save-team-fit.usecase.js"
    );

    let storedResult: TeamFitSavedResult | null = null;

    const output = await saveTeamFitUseCase(
      { idea: validIdea, team: validTeam, result: legacyResult, userId: "user-1" },
      {
        findPackageById: async () => freePkg as unknown as ServicePackage,
        findTeamFitReportsByOwner: async () => [],
        findCaseByCode: async () => null,
        createCaseAndReport: async (data) => {
          storedResult = data.result;
          return { id: "case-legacy", case_code: data.caseCode };
        },
      },
    );

    assert.strictEqual(output.isNew, true);
    assert.deepStrictEqual(storedResult, legacyResult);
  });

  await t.test("creates case with paid package and correct payment_status", async () => {
    const { saveTeamFitUseCase } = await import(
      "../../../modules/ai-engine/application/save-team-fit.usecase.js"
    );

    let createdCaseData: any = null;

    await saveTeamFitUseCase(
      { idea: validIdea, team: validTeam, result: validResult, packageId: "pkg_tf_audit", userId: "user-1" },
      {
        findPackageById: async (id) => {
          assert.strictEqual(id, "pkg_tf_audit");
          return auditPkg as any;
        },
        findTeamFitReportsByOwner: async () => [],
        findCaseByCode: async () => null,
        createCaseAndReport: async (data) => {
          createdCaseData = data;
          return { id: "case-paid", case_code: data.caseCode };
        },
      },
    );

    assert.strictEqual(createdCaseData.packageId, "pkg_tf_audit");
    assert.strictEqual(createdCaseData.lockedPrice, 39000);
    assert.strictEqual(createdCaseData.isFree, false);
  });

  await t.test("case_code retries on collision", async () => {
    const { saveTeamFitUseCase } = await import(
      "../../../modules/ai-engine/application/save-team-fit.usecase.js"
    );

    let codeCallCount = 0;

    await saveTeamFitUseCase(
      { idea: validIdea, team: validTeam, result: validResult, userId: "user-1" },
      {
        findPackageById: async () => freePkg as any,
        findTeamFitReportsByOwner: async () => [],
        findCaseByCode: async () => {
          codeCallCount++;
          // Simulate collision on first 2 attempts
          return codeCallCount <= 2 ? { id: "existing" } : null;
        },
        createCaseAndReport: async (data) => {
          return { id: "case-retry", case_code: data.caseCode };
        },
      },
    );

    assert.strictEqual(codeCallCount, 3); // 2 collisions + 1 success
  });

  await t.test("case_code collision exhausted throws error", async () => {
    const { saveTeamFitUseCase } = await import(
      "../../../modules/ai-engine/application/save-team-fit.usecase.js"
    );
    const { AppError } = await import("../../domain/app-error.js");

    try {
      await saveTeamFitUseCase(
        { idea: validIdea, team: validTeam, result: validResult, userId: "user-1" },
        {
          findPackageById: async () => freePkg as any,
          findTeamFitReportsByOwner: async () => [],
          // Always return existing → all 3 attempts collide
          findCaseByCode: async () => ({ id: "existing" }),
          createCaseAndReport: async () => {
            throw new Error("Should not create case");
          },
        },
      );
      assert.fail("Should throw");
    } catch (err) {
      assert.ok(err instanceof AppError);
      assert.strictEqual(err.code, "CASE_CODE_COLLISION");
      assert.strictEqual(err.status, 500);
    }
  });
});
