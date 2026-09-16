import { spawn } from "node:child_process";
import { writeFileSync, readFileSync, mkdirSync, rmSync, existsSync, copyFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { marked } from "marked";
import { localizeAndCleanMarkdown } from "./mdNormalizer.js";
import { markdownToTypst } from "./mdToTypst.js";
import { resolveTypstBinary } from "./typstRunner.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TEMPLATES_DIR = resolve(__dirname, "templates");
const FONTS_DIR = resolve(__dirname, "fonts");

export interface EvaluationJob {
  id: string;
  projectName?: string;
  agent?: string;
  createdAt?: string | Date;
  status?: string;
  [key: string]: unknown;
}

export interface AgentExecutionResult {
  markdownReport?: string;
  reportJson?: unknown;
  [key: string]: unknown;
}
export interface GeneratePdfOptions {
  markdown: string;
  meta: {
    projectName: string;
    jobId: string;
    agentName: string;
    createdAt: string;
    overallScore: number;
    verdict: string;
    categoryScores: {
      problemClarity: number;
      marketViability: number;
      businessModel: number;
      competitiveMoat: number;
      executionFeasibility: number;
    };
    reportType?: string;
  };
  storageDir: string;
  force?: boolean;
}

/**
 * Chuyển đổi timestamp (ISO string / Date) thành định dạng ngày giờ tiếng Việt
 * thân thiện cho người đọc trên báo cáo A4.
 * Ví dụ: "2026-09-12T07:31:24.457Z" → "14:31, 12/09/2026" (giờ Việt Nam GMT+7)
 */
export function formatReportDateTime(dateInput?: string | Date): string {
  if (!dateInput) return "";
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return String(dateInput);

  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Ho_Chi_Minh",
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour12: false,
    }).formatToParts(d);

    const map: Record<string, string> = {};
    for (const p of parts) map[p.type] = p.value;
    return `${map.hour}:${map.minute}, ${map.day}/${map.month}/${map.year}`;
  } catch {
    return d.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
  }
}

/**
 * Chuyển tên dự án tiếng Việt (có dấu, ký tự đặc biệt) thành slug an toàn
 * cho filename tải về. Ví dụ: "BeautyHub — Nền tảng TMĐT" → "beautyhub-nen-tang-tmdt"
 */
export function makeDownloadSlug(name: string): string {
  return (
    name
      .replace(/[đĐ]/g, "d")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 50) || "project"
  );
}

/**
 * Trích xuất định danh loại báo cáo (report_type) tương ứng với system prompt đã dùng.
 * Mặc định là 'input_clarification' (cho input_clarification_gate_lite_v1_1 & v4_1).
 * Khi hệ thống mở rộng thêm prompt khác (vd: reality_check, due_diligence),
 * hàm này tự động nhận diện từ meta, tên prompt hoặc nội dung markdown.
 */
export function resolveReportType(opts?: {
  reportType?: string;
  markdown?: string;
  systemPrompt?: string;
}): string {
  if (opts?.reportType) {
    return makeDownloadSlug(opts.reportType);
  }
  if (opts?.systemPrompt) {
    const sp = opts.systemPrompt.toLowerCase();
    if (sp.includes("reality_check")) return "reality_check";
    if (sp.includes("due_diligence")) return "due_diligence";
    if (sp.includes("clarification")) return "input_clarification";
  }
  const md = (opts?.markdown || "").toLowerCase().slice(0, 500);
  if (md.includes("reality check") || md.includes("reality_check")) {
    return "reality_check";
  }
  if (md.includes("due diligence") || md.includes("due_diligence")) {
    return "due_diligence";
  }
  return "input_clarification";
}

/**
 * Tạo tên file PDF chuẩn hóa: {slug}_{report_type}_{timestamp}.pdf
 * Ví dụ: "wayvee_input_clarification_20260912143124.pdf"
 */
export function buildReportPdfFilename(opts: {
  projectName: string;
  reportType?: string;
  markdown?: string;
  createdAt?: Date | string | null;
  versionNo?: number | null;
}): string {
  const slug = makeDownloadSlug(opts.projectName);
  const type = resolveReportType({
    reportType: opts.reportType,
    markdown: opts.markdown,
  });
  const d = opts.createdAt ? new Date(opts.createdAt) : new Date();
  const validDate = isNaN(d.getTime()) ? new Date() : d;
  const pad = (n: number) => String(n).padStart(2, "0");
  const timestamp = `${validDate.getFullYear()}${pad(validDate.getMonth() + 1)}${pad(validDate.getDate())}${pad(validDate.getHours())}${pad(validDate.getMinutes())}${pad(validDate.getSeconds())}`;
  const versionSuffix = opts.versionNo != null ? `_v${String(opts.versionNo).padStart(2, "0")}` : "";
  return `${slug}_${type}_${timestamp}${versionSuffix}.pdf`;
}

/**
 * Compile báo cáo Typst → PDF, lưu kết quả vào storage, trả về Buffer.
 *
 * Storage layout (timestamped — multiple versions coexist, newest served):
 *   {storageDir}/jobs/{jobId}/reports/{agent}_YYYYMMDD-HHmmss.pdf
 *   {storageDir}/jobs/{jobId}/reports/{agent}_YYYYMMDD-HHmmss.source.typ
 *   {storageDir}/jobs/{jobId}/reports/{agent}_YYYYMMDD-HHmmss.meta.json
 *
 * Cache hit = most recent {agent}_*.pdf for that jobId+agent combo.
 */
export async function generateReportPdfBuffer(opts: GeneratePdfOptions): Promise<Buffer> {
  const { jobId, agentName } = opts.meta;
  const agent = agentName.toLowerCase();

  // ── 1. Serve most recent cached PDF if available (unless force=true) ──
  const reportsDir = join(opts.storageDir, "jobs", jobId, "reports");
  if (!opts.force && existsSync(reportsDir)) {
    const existing = readdirSync(reportsDir)
      .filter(f => f.startsWith(`${agent}_`) && f.endsWith(".pdf"))
      .sort()        // ISO timestamp suffix → lexicographic = chronological
      .at(-1);       // newest
    if (existing) {
      return readFileSync(join(reportsDir, existing));
    }
  }

  // ── 2. Chuẩn bị template & nội dung ─────────────────────────────
  const typstBin = resolveTypstBinary();
  const templatePath = join(TEMPLATES_DIR, "report.typ");
  const templateRaw = readFileSync(templatePath, "utf-8");

  let markdownToUse = opts.markdown || "";
  if (markdownToUse.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(markdownToUse) as Record<string, unknown>;
      if (parsed && typeof parsed["reportMarkdown"] === "string" && parsed["reportMarkdown"].trim().length > 0) {
        markdownToUse = parsed["reportMarkdown"] as string;
      }
    } catch {
      // not valid json, keep as is
    }
  }

  const cleanMd = localizeAndCleanMarkdown(markdownToUse);
  const bodyTypst = markdownToTypst(cleanMd);
  const filledTypst = templateRaw.replace("{{BODY_CONTENT}}", bodyTypst);

  // ── 3. Tạo temp dir cách ly ──────────────────────────────────────
  const shortUuid = randomUUID().slice(0, 6);
  const workDir = join(tmpdir(), `typst_${jobId}_${agent}_${shortUuid}`);
  mkdirSync(workDir, { recursive: true });

  const tempTyp = join(workDir, "report.typ");
  const tempMetaJson = join(workDir, "meta.json");
  const tempPdf = join(workDir, "report.pdf");

  writeFileSync(tempMetaJson, JSON.stringify({
    project_name: opts.meta.projectName,
    job_id: jobId,
    agent_name: agent,
    created_at: formatReportDateTime(opts.meta.createdAt),
    overall_score: opts.meta.overallScore,
    verdict: opts.meta.verdict,
    scores: opts.meta.categoryScores,
  }), "utf-8");

  writeFileSync(tempTyp, filledTypst, "utf-8");

  // Save source.typ + meta early (inspectable even on compile failure)
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const ts = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}-${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}`;
  const stamp = `${agent}_${ts}`; // e.g. omp_20260909-082817
  mkdirSync(reportsDir, { recursive: true });
  copyFileSync(tempTyp,      join(reportsDir, `${stamp}.source.typ`));
  copyFileSync(tempMetaJson, join(reportsDir, `${stamp}.meta.json`));

  // ── 4. Compile Typst → PDF ───────────────────────────────────────
  return new Promise((res, rej) => {
    const proc = spawn(typstBin, [
      "compile",
      tempTyp,
      tempPdf,
      "--font-path", FONTS_DIR,
      "--diagnostic-format", "short",
    ], {
      timeout: 30000,
      env: { ...process.env, TYPST_FONT_PATHS: FONTS_DIR },
    });

    let stderr = "";
    proc.stderr.on("data", (chunk) => { stderr += chunk.toString(); });

    proc.on("close", (code) => {
      try {
        if (code === 0) {
          const buf = readFileSync(tempPdf);

          // ── 5. Lưu vào storage (cache cho lần sau) ───────────
          copyFileSync(tempPdf,      join(reportsDir, `${stamp}.pdf`));
          copyFileSync(tempTyp,      join(reportsDir, `${stamp}.source.typ`));
          copyFileSync(tempMetaJson, join(reportsDir, `${stamp}.meta.json`));

          res(buf);
        } else {
          rej(new Error(`Typst compilation failed (code ${code}): ${stderr.slice(0, 500)}`));
        }
      } catch (e) {
        rej(e);
      } finally {
        try { rmSync(workDir, { recursive: true, force: true }); } catch {}
      }
    });

    proc.on("error", (err) => {
      try { rmSync(workDir, { recursive: true, force: true }); } catch {}
      rej(new Error(`Failed to execute Typst: ${err.message}`));
    });
  });
}

/**
 * Build the formal HTML report for /report.html endpoint.
 * Kept for HTML preview fallback — not used for PDF generation.
 */
export function buildFormalReportHtml({
  job,
  result,
  agentName,
}: {
  job: EvaluationJob;
  result: AgentExecutionResult;
  agentName: string;
}): string {
  const report =
    result.reportJson && typeof result.reportJson === "object"
      ? (result.reportJson as Record<string, unknown>)
      : null;
  const score = typeof report?.overallScore === "number" ? report.overallScore : 0;
  const rawVerdict = typeof report?.verdict === "string" ? report.verdict.toUpperCase() : "CHƯA XÁC ĐỊNH";

  let verdict = rawVerdict;
  if (rawVerdict.includes("NOT READY")) {
    verdict = "CHƯA ĐỦ ĐIỀU KIỆN KIỂM CHỨNG THỰC TẾ";
  } else if (rawVerdict.includes("PARTIALLY READY")) {
    verdict = "ĐỦ ĐIỀU KIỆN MỘT PHẦN";
  } else if (rawVerdict.includes("READY")) {
    verdict = "ĐỦ ĐIỀU KIỆN KIỂM CHỨNG THỰC TẾ";
  }

  const creationDate = job.createdAt ? new Date(job.createdAt).toLocaleString("vi-VN") : new Date().toLocaleString("vi-VN");
  const projectName =
    (typeof report?.projectName === "string" && report.projectName) ||
    (typeof job.projectName === "string" && job.projectName) ||
    "Dự án khởi nghiệp";

  const cleanedMd = typeof result.reportMarkdown === "string" ? localizeAndCleanMarkdown(result.reportMarkdown) : "";
  const markdownBodyHtml = cleanedMd ? (marked.parse(cleanedMd) as string) : "";
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Báo cáo thẩm định — ${projectName}</title>
  <link href="https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,400;0,700;0,900;1,400&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    @page { size: A4; margin: 18mm 16mm 22mm 16mm; }
    body {
      font-family: 'Merriweather', Georgia, serif;
      font-size: 13pt;
      line-height: 1.6;
      color: #1e293b;
      max-width: 210mm;
      margin: 0 auto;
      padding: 20mm 16mm;
      background: #fff;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #1e3a8a;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .header h1 { color: #1e3a8a; font-size: 20pt; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 2px; }
    .header .subtitle { color: #64748b; font-size: 11pt; }
    .meta-box {
      background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px;
      padding: 12px 16px; margin-bottom: 20px; font-size: 10pt;
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;
    }
    .meta-box .label { color: #64748b; }
    .meta-box .value { font-weight: 700; }
    .scorecard { background: #1e3a8a; color: #fff; border-radius: 8px; padding: 20px; margin-bottom: 24px; }
    .scorecard .total { font-size: 36pt; font-weight: 900; }
    .scorecard .verdict-badge {
      display: inline-block; padding: 4px 12px; border-radius: 4px;
      font-weight: 700; font-size: 11pt; background: ${score >= 70 ? "#22c55e" : "#ef4444"};
    }
    h1 { color: #1e3a8a; font-size: 16pt; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px; }
    h2 { color: #1e3a8a; font-size: 13pt; }
    h3 { color: #334155; font-size: 11pt; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 10pt; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
    th { background: #f1f5f9; font-weight: 700; }
    blockquote { border-left: 3px solid #1e3a8a; margin: 12px 0; padding: 8px 16px; background: #f8fafc; color: #475569; }
    code { background: #f1f5f9; padding: 2px 6px; border-radius: 3px; font-size: 10pt; }
    pre { background: #1e293b; color: #e2e8f0; padding: 12px 16px; border-radius: 6px; overflow-x: auto; font-size: 9pt; }
    pre code { background: none; padding: 0; color: inherit; }
    .footer {
      margin-top: 32px; padding-top: 8px; border-top: 1px solid #cbd5e1;
      font-size: 8pt; color: #94a3b8; display: flex; justify-content: space-between;
    }
    @media print { body { padding: 0; } .header { page-break-after: avoid; } table { page-break-inside: avoid; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>Báo Cáo Phản Biện</h1>
    <div class="subtitle">${projectName}</div>
  </div>
  <div class="meta-box">
    <div><span class="label">Dự án:</span> <span class="value">${projectName}</span></div>
    <div><span class="label">Job ID:</span> <span class="value">${job.id}</span></div>
    <div><span class="label">Agent:</span> <span class="value">${agentName.toUpperCase()}</span></div>
    <div><span class="label">Ngày:</span> <span class="value">${creationDate}</span></div>
  </div>
  <div class="scorecard">
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <div>
        <div style="font-size:11pt;opacity:0.8;">ĐIỂM TỔNG QUÁT</div>
        <div class="total">${score} / 100</div>
      </div>
      <div class="verdict-badge">${verdict}</div>
    </div>
  </div>
  <div class="report-body">${markdownBodyHtml}</div>
  <div class="footer">
    <span>Báo cáo bảo mật — FPT Startup Benchmark</span>
    <span>Được tạo tự động bởi ${agentName.toUpperCase()}</span>
  </div>
</body>
</html>`;
}
