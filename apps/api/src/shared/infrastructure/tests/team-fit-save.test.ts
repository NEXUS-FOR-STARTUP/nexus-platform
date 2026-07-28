import { test } from "node:test";
import assert from "node:assert";

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

const validTeam = [
  {
    major: "Software Engineering",
    strengths: ["React", "Node.js", "UI/UX Design"],
    experience: ["Đã build 2 website e-commerce trong môn SWP391"],
  },
  {
    major: "Business Administration",
    strengths: ["Market Research", "Financial Planning"],
    experience: ["Thực tập tại công ty F&B 3 tháng"],
  },
];

const validResult = {
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
    let createdReportData: any = null;

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
