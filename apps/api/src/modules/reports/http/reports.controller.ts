import type { Context } from "hono";
import {
  requireCaseAccess,
  requireReportCaseAccess,
} from "../../../shared/infrastructure/authorization.js";
import {
  handleError,
  readJsonBody,
} from "../../../shared/infrastructure/http-helpers.js";
import { getDraftReportUseCase } from "../application/get-draft-report.usecase.js";
import { editReportUseCase } from "../application/edit-report.usecase.js";
import { approveReportUseCase } from "../application/approve-report.usecase.js";
import { getLatestReportUseCase } from "../application/get-latest-report.usecase.js";
import { findReportById } from "../infrastructure/persistence/report.repository.js";
import {
  generateReportPdfBuffer,
  makeDownloadSlug,
  resolveReportType,
  buildReportPdfFilename,
} from "../infrastructure/pdf/pdfService.js";
import { AppError } from "../../../shared/domain/app-error.js";
import { resolve } from "node:path";
import { existsSync, readFileSync } from "node:fs";
import { prisma } from "../../../db.js";
import { resolveRepoRoot } from "../../ai-engine/omp-audit.service.js";
import { uploadFile } from "../../../services/cloudinary.js";
import { upsertReportArtifactDocumentRecord } from "../../documents/infrastructure/persistence/document.repository.js";
import logger from "../../../shared/infrastructure/logger.js";
export async function getDraftReportHandler(c: Context) {
  const caseId = c.req.param("caseId") || "";
  const access = await requireCaseAccess(c, caseId, {
    allowStudent: false,
    allowSupporter: true,
    allowAdmin: true,
  });

  if (!access.ok) {
    return access.response;
  }

  try {
    const result = await getDraftReportUseCase(caseId);
    return c.json(result);
  } catch (error: any) {
    return handleError(c, error);
  }
}

export async function editReportHandler(c: Context) {
  const reportId = c.req.param("id") || "";
  const access = await requireReportCaseAccess(c, reportId, {
    allowStudent: false,
    allowSupporter: true,
    allowAdmin: false,
  });

  if (!access.ok) {
    return access.response;
  }

  try {
    const body = (await readJsonBody(c)) as { contentMd?: string };
    const contentMd = body?.contentMd || "";
    const result = await editReportUseCase(
      reportId,
      access.caseRecord.id,
      contentMd,
    );
    return c.json(result);
  } catch (error: any) {
    return handleError(c, error);
  }
}

export async function approveReportHandler(c: Context) {
  const reportId = c.req.param("id") || "";
  const access = await requireReportCaseAccess(c, reportId, {
    allowStudent: false,
    allowSupporter: true,
    allowAdmin: false,
  });

  if (!access.ok) {
    return access.response;
  }

  try {
    const result = await approveReportUseCase(access.session.user.id, reportId);
    return c.json(result);
  } catch (error: any) {
    return handleError(c, error);
  }
}

export async function getLatestReportHandler(c: Context) {
  const caseId = c.req.param("caseId") || "";
  const access = await requireCaseAccess(c, caseId, {
    allowStudent: true,
    allowSupporter: true,
    allowAdmin: true,
  });

  if (!access.ok) {
    return access.response;
  }

  try {
    const result = await getLatestReportUseCase(caseId);
    return c.json(result);
  } catch (error: any) {
    return handleError(c, error);
  }
}

export async function downloadCaseReportPdfHandler(c: Context) {
  const caseId = c.req.param("caseId") || c.req.param("id") || "";
  const access = await requireCaseAccess(c, caseId, {
    allowStudent: true,
    allowSupporter: true,
    allowAdmin: true,
  });

  if (!access.ok) {
    return access.response;
  }

  try {
    const report = await getLatestReportUseCase(caseId);
    if (!report) {
      throw new AppError(404, "REPORT_NOT_FOUND", "Chưa có báo cáo nào được xuất bản cho hồ sơ này");
    }

    let reportMarkdown = report.content_md;
    let overallScore = 65;
    let verdict = "PARTIALLY READY FOR REALITY CHECK";
    let categoryScores = {
      problemClarity: 65,
      marketViability: 60,
      businessModel: 65,
      competitiveMoat: 60,
      executionFeasibility: 70,
    };
    let parsed: Record<string, unknown> | null =
      report.metadata_json && typeof report.metadata_json === "object"
        ? (report.metadata_json as Record<string, unknown>)
        : null;

    if (!parsed) {
      try {
        const maybeParsed = JSON.parse(report.content_md) as Record<string, unknown>;
        if (maybeParsed && typeof maybeParsed === "object") {
          parsed = maybeParsed;
          if (typeof maybeParsed["reportMarkdown"] === "string") {
            reportMarkdown = maybeParsed["reportMarkdown"] as string;
          }
        }
      } catch {
        // Content is plain markdown
      }
    }

    if (parsed) {
      if (typeof parsed["overallScore"] === "number") {
        overallScore = parsed["overallScore"] as number;
      }
      if (typeof parsed["verdict"] === "string") {
        verdict = parsed["verdict"] as string;
      }
      if (parsed["categoryScores"] && typeof parsed["categoryScores"] === "object") {
        categoryScores = parsed["categoryScores"] as {
          problemClarity: number;
          marketViability: number;
          businessModel: number;
          competitiveMoat: number;
          executionFeasibility: number;
        };
      }
    }

    const rootDir = resolveRepoRoot();
    const storageDir = resolve(rootDir, "storage");

    // 1. Prioritize reading pure Markdown directly from disk output if available
    const diskMdPath = resolve(storageDir, "jobs", caseId, "output", "input_clarification_audit.md");
    if (existsSync(diskMdPath)) {
      try {
        const diskContent = readFileSync(diskMdPath, "utf-8");
        if (diskContent && diskContent.trim().length > 0) {
          reportMarkdown = diskContent;
        }
      } catch {
        // keep fallback
      }
    }

    // 2. Guard: if reportMarkdown still starts with '{', safely unwrap JSON
    if (reportMarkdown.trim().startsWith("{")) {
      try {
        const p = JSON.parse(reportMarkdown);
        if (p && typeof p.reportMarkdown === "string" && p.reportMarkdown.trim().length > 0) {
          reportMarkdown = p.reportMarkdown;
        }
      } catch {
        // keep as is
      }
    }

    const caseRecord = await prisma.case.findUnique({
      where: { id: caseId },
      select: { team_name: true, case_code: true },
    });
    // Prioritize actual project name (e.g. WAYVEE) over student team group name (e.g. Nexus)
    const projectName =
      (parsed && typeof parsed["projectName"] === "string" && parsed["projectName"].trim().length > 0 && parsed["projectName"]) ||
      caseRecord?.team_name ||
      caseRecord?.case_code ||
      "Dự án khởi nghiệp";

    const reportType = resolveReportType({
      reportType: (parsed && typeof parsed["reportType"] === "string" && parsed["reportType"]) || undefined,
      markdown: reportMarkdown,
    });

    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await generateReportPdfBuffer({
        markdown: reportMarkdown,
        meta: {
          projectName,
          jobId: caseId,
          agentName: "omp",
          createdAt: report.created_at.toISOString(),
          overallScore,
          verdict,
          categoryScores,
          reportType,
        },
        storageDir,
        force: true,
      });
    } catch (pdfErr) {
      logger.warn({ caseId, pdfErr }, "Typst compilation failed in downloadCaseReportPdfHandler, checking Cloudinary");
      const cloudinaryUrl = (parsed?.pdfUrl as string | undefined) ?? null;
      if (cloudinaryUrl) {
        try {
          const res = await fetch(cloudinaryUrl);
          if (res.ok) {
            pdfBuffer = Buffer.from(await res.arrayBuffer());
          } else {
            throw new AppError(500, "PDF_GENERATION_FAILED", "Không thể tạo file PDF báo cáo lúc này. Vui lòng thử lại sau.");
          }
        } catch {
          throw new AppError(500, "PDF_GENERATION_FAILED", "Không thể tạo file PDF báo cáo lúc này. Vui lòng thử lại sau.");
        }
      } else {
        throw new AppError(500, "PDF_GENERATION_FAILED", "Không thể tạo file PDF báo cáo lúc này. Vui lòng thử lại sau.");
      }
    }

    // Resolve version_no from lifecycle_unit for PDF filename
    let reportVersionNo: number | null = null;
    if (report.lifecycle_unit_id) {
      const unit = await prisma.lifecycleUnit.findUnique({
        where: { id: report.lifecycle_unit_id },
        select: { version_no: true },
      });
      reportVersionNo = unit?.version_no ?? null;
    }

    const filename = buildReportPdfFilename({
      projectName,
      reportType,
      createdAt: report.created_at,
      versionNo: reportVersionNo,
    });
    const safeFilename = filename.replace(/["\r\n\\]/g, "");

    const isInline = c.req.query("view") === "inline" || c.req.query("inline") === "true";
    // Upload to Cloudinary (best-effort, downloads only — inline views skip the sync).
    // public_id keeps the .pdf suffix so the stored URL carries a proper filename.
    if (!isInline) try {
      const versionSuffix = reportVersionNo != null ? `_v${String(reportVersionNo).padStart(2, "0")}` : "";
      const cloudinaryName = `audit_report${versionSuffix}.pdf`;
      const uploadRes = await uploadFile(
        pdfBuffer,
        `nexus/reports/${caseId}`,
        cloudinaryName,
        "raw",
        true,
      );
      if (uploadRes?.fileUrl) {
        const updatedMeta = {
          ...((report.metadata_json as Record<string, unknown>) || parsed || {}),
          pdfUrl: uploadRes.fileUrl,
          pdfPublicId: uploadRes.publicId,
        };
        await prisma.report.update({
          where: { id: report.id },
          data: {
            metadata_json: updatedMeta satisfies Record<string, unknown>,
          },
        });
        await upsertReportArtifactDocumentRecord(
          caseId,
          report.checkpoint_id,
          report.lifecycle_unit_id,
          null,
          report.id,
          report.created_by,
          prisma,
          {
            fileUrl: uploadRes.fileUrl,
            downloadUrl: uploadRes.fileUrl,
            cloudinaryPublicId: uploadRes.publicId,
            originalName: safeFilename,
            extension: "pdf",
            mimeType: "application/pdf",
          },
        );
      }
    } catch (uploadErr) {
      logger.warn({ err: uploadErr, caseId }, "Cloudinary sync in download handler");
    }

    const disposition = isInline ? "inline" : "attachment";

    c.header("Content-Type", "application/pdf");
    c.header("Content-Disposition", `${disposition}; filename="${safeFilename}"; filename*=UTF-8''${encodeURIComponent(safeFilename)}`);
    c.header("Content-Length", pdfBuffer.length.toString());
    c.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
    return c.body(new Uint8Array(pdfBuffer));
  } catch (error: unknown) {
    return handleError(c, error);
  }
}

/**
 * GET /api/reports/:reportId/download — Download PDF for a specific report version.
 * Ownership check via report.case_id → requireReportCaseAccess.
 */
export async function downloadReportPdfByIdHandler(c: Context) {
  const reportId = c.req.param("reportId") || "";
  if (!reportId) {
    return c.json({ code: "MISSING_REPORT_ID", message: "Thiếu reportId" }, 400);
  }

  // Ownership check via report.case_id
  const access = await requireReportCaseAccess(c, reportId);
  if (!access.ok) {
    return access.response;
  }

  try {
    const report = await findReportById(reportId);
    if (!report) {
      throw new AppError(404, "REPORT_NOT_FOUND", "Không tìm thấy báo cáo");
    }

    const caseId = report.case_id;

    // Resolve version_no from lifecycle_unit
    let versionNo: number | null = null;
    if (report.lifecycle_unit_id) {
      const unit = await prisma.lifecycleUnit.findUnique({
        where: { id: report.lifecycle_unit_id },
        select: { version_no: true },
      });
      versionNo = unit?.version_no ?? null;
    }

    let reportMarkdown = report.content_md;
    let overallScore = 65;
    let verdict = "PARTIALLY READY FOR REALITY CHECK";
    let categoryScores = {
      problemClarity: 65,
      marketViability: 60,
      businessModel: 65,
      competitiveMoat: 60,
      executionFeasibility: 70,
    };
    let parsed: Record<string, unknown> | null =
      report.metadata_json && typeof report.metadata_json === "object"
        ? (report.metadata_json as Record<string, unknown>)
        : null;

    if (!parsed) {
      try {
        const maybeParsed = JSON.parse(report.content_md) as Record<string, unknown>;
        if (maybeParsed && typeof maybeParsed === "object") {
          parsed = maybeParsed;
          if (typeof maybeParsed["reportMarkdown"] === "string") {
            reportMarkdown = maybeParsed["reportMarkdown"] as string;
          }
        }
      } catch {
        // Content is plain markdown
      }
    }

    if (parsed) {
      if (typeof parsed["overallScore"] === "number") overallScore = parsed["overallScore"] as number;
      if (typeof parsed["verdict"] === "string") verdict = parsed["verdict"] as string;
      if (parsed["categoryScores"] && typeof parsed["categoryScores"] === "object") {
        categoryScores = parsed["categoryScores"] as typeof categoryScores;
      }
    }

    const rootDir = resolveRepoRoot();
    const storageDir = resolve(rootDir, "storage");

    // Try reading from disk first
    const diskMdPath = resolve(storageDir, "jobs", caseId, "output", "input_clarification_audit.md");
    if (existsSync(diskMdPath)) {
      try {
        const diskContent = readFileSync(diskMdPath, "utf-8");
        if (diskContent && diskContent.trim().length > 0) reportMarkdown = diskContent;
      } catch { /* keep fallback */ }
    }

    if (reportMarkdown.trim().startsWith("{")) {
      try {
        const p = JSON.parse(reportMarkdown);
        if (p && typeof p.reportMarkdown === "string" && p.reportMarkdown.trim().length > 0) {
          reportMarkdown = p.reportMarkdown;
        }
      } catch { /* keep as is */ }
    }

    const caseRecord = await prisma.case.findUnique({
      where: { id: caseId },
      select: { team_name: true, case_code: true },
    });
    const projectName =
      (parsed && typeof parsed["projectName"] === "string" && parsed["projectName"].trim().length > 0 && parsed["projectName"]) ||
      caseRecord?.team_name ||
      caseRecord?.case_code ||
      "Dự án khởi nghiệp";

    const reportType = resolveReportType({
      reportType: (parsed && typeof parsed["reportType"] === "string" && parsed["reportType"]) || undefined,
      markdown: reportMarkdown,
    });

    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await generateReportPdfBuffer({
        markdown: reportMarkdown,
        meta: {
          projectName,
          jobId: caseId,
          agentName: "omp",
          createdAt: report.created_at.toISOString(),
          overallScore,
          verdict,
          categoryScores,
          reportType,
        },
        storageDir,
        force: true,
      });
    } catch (pdfErr) {
      logger.warn({ caseId, pdfErr }, "Typst compilation failed in downloadReportPdfByIdHandler, checking Cloudinary");
      const cloudinaryUrl = (parsed?.pdfUrl as string | undefined) ?? null;
      if (cloudinaryUrl) {
        try {
          const res = await fetch(cloudinaryUrl);
          if (res.ok) {
            pdfBuffer = Buffer.from(await res.arrayBuffer());
          } else {
            throw new AppError(500, "PDF_GENERATION_FAILED", "Không thể tạo file PDF báo cáo lúc này. Vui lòng thử lại sau.");
          }
        } catch {
          throw new AppError(500, "PDF_GENERATION_FAILED", "Không thể tạo file PDF báo cáo lúc này. Vui lòng thử lại sau.");
        }
      } else {
        throw new AppError(500, "PDF_GENERATION_FAILED", "Không thể tạo file PDF báo cáo lúc này. Vui lòng thử lại sau.");
      }
    }

    const filename = buildReportPdfFilename({
      projectName,
      reportType,
      createdAt: report.created_at,
      versionNo,
    });
    const safeFilename = filename.replace(/["\r\n\\]/g, "");

    const isInline = c.req.query("view") === "inline" || c.req.query("inline") === "true";
    // Upload to Cloudinary (best-effort, downloads only — inline views skip the sync).
    // public_id keeps the .pdf suffix so the stored URL carries a proper filename.
    if (!isInline) try {
      const versionSuffix = versionNo != null ? `_v${String(versionNo).padStart(2, "0")}` : "";
      const cloudinaryName = `audit_report${versionSuffix}.pdf`;
      const uploadRes = await uploadFile(
        pdfBuffer,
        `nexus/reports/${caseId}`,
        cloudinaryName,
        "raw",
        true,
      );
      if (uploadRes?.fileUrl) {
        const updatedMeta = {
          ...((report.metadata_json as Record<string, unknown>) || parsed || {}),
          pdfUrl: uploadRes.fileUrl,
          pdfPublicId: uploadRes.publicId,
        };
        await prisma.report.update({
          where: { id: report.id },
          data: { metadata_json: updatedMeta satisfies Record<string, unknown> },
        });
      }
    } catch (uploadErr) {
      logger.warn({ err: uploadErr, reportId }, "Cloudinary sync in report-by-id handler");
    }

    const disposition = isInline ? "inline" : "attachment";

    c.header("Content-Type", "application/pdf");
    c.header("Content-Disposition", `${disposition}; filename="${safeFilename}"; filename*=UTF-8''${encodeURIComponent(safeFilename)}`);
    c.header("Content-Length", pdfBuffer.length.toString());
    c.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
    return c.body(new Uint8Array(pdfBuffer));
  } catch (error: unknown) {
    return handleError(c, error);
  }
}
