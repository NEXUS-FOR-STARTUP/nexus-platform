# Phase 02: OMP Audit Runner & Typst PDF Engine
> **Trạng thái:** Completed (100% Hoàn thành)


## 1. Mục tiêu (Objective)
Kế thừa nguyên xi logic thực thi từ `test-agent-sanbox-web/apps/worker-omp` sang `nexus-platform`. Xây dựng một service duy nhất `omp-audit.service.ts` để khởi chạy OMP CLI tự động thẩm định bài nộp đối chiếu với CSDL SQLite `startup_knowledge.db`, và tích hợp Typst PDF Engine xuất bản báo cáo PDF A4 vector trong 0.4s.

---

## 2. Quyền Sở hữu File (File Ownership)
- `apps/api/package.json` (Cài đặt thêm `marked: ^18.0.12`)
- `apps/api/src/modules/ai-engine/omp-audit.service.ts` (Service tạo sandbox job, copy input + SQLite DB, gọi `omp` CLI)
- `apps/api/src/modules/reports/infrastructure/pdf/mdNormalizer.ts` (Bộ lọc ngôn ngữ, chuẩn hóa 14 tiêu chí, xóa mã lỗi `ERR_*`)
- `apps/api/src/modules/reports/infrastructure/pdf/mdToTypst.ts` (Marked AST Lexer chuyển Markdown sang Typst table)
- `apps/api/src/modules/reports/infrastructure/pdf/typstRunner.ts` (Thực thi nhị phân `typst` CLI)
- `apps/api/src/modules/reports/infrastructure/pdf/pdfService.ts` (Biên dịch báo cáo A4 vector PDF)
- `apps/api/src/modules/reports/infrastructure/pdf/templates/report.typ` (Template A4 chuẩn)
- `apps/api/src/modules/reports/infrastructure/pdf/fonts/Merriweather/*` (Bộ font Merriweather nhúng cục bộ)

---

## 3. Các Bước Triển khai Chi tiết (Step-by-Step Implementation)

### Bước 2.1: Cài đặt Dependency `marked`
- Chạy: `npm install marked` tại `apps/api`.

### Bước 2.2: Xây dựng OMP Audit Service (`omp-audit.service.ts`)
Bê trực tiếp logic chuẩn bị sandbox và spawn tiến trình từ `apps/worker-omp/src/index.ts`:
```ts
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, copyFileSync, writeFileSync, readFileSync } from "node:fs";
import path from "node:path";
import logger from "../../shared/infrastructure/logger.js";

export interface OmpAuditOptions {
  caseId: string;
  projectName: string;
  inputFiles: Array<{ name: string; content: string | Buffer }>;
  model?: string; // Mặc định cheapkeyai/gemini-3.8-flash hoặc mimo/mimo-v2.5
}

export async function runOmpAudit(opts: OmpAuditOptions): Promise<{
  reportJson: any;
  reportMarkdown: string;
  pdfBuffer: Buffer;
}> {
  const jobDir = path.resolve(process.cwd(), `storage/jobs/${opts.caseId}`);
  const inputDir = path.resolve(jobDir, "input");
  const knowledgeDir = path.resolve(jobDir, "knowledge");
  const promptDir = path.resolve(jobDir, "system_prompt");
  const outputDir = path.resolve(jobDir, "output");

  [inputDir, knowledgeDir, promptDir, outputDir].forEach(d => mkdirSync(d, { recursive: true }));

  // 1. Copy SQLite database trực tiếp vào sandbox
  const masterDb = path.resolve(process.cwd(), "data/knowledge/startup_knowledge.db");
  copyFileSync(masterDb, path.resolve(knowledgeDir, "startup_knowledge.db"));
  copyFileSync(path.resolve(process.cwd(), "data/knowledge/AGENTS.md"), path.resolve(jobDir, "AGENTS.md"));

  // 2. Copy Prompts
  copyFileSync(path.resolve(process.cwd(), "data/system_prompt/triad_framework_v1_1.md"), path.resolve(promptDir, "triad_framework_v1_1.md"));
  copyFileSync(path.resolve(process.cwd(), "data/system_prompt/input_clarification_gate_lite_v1_1.md"), path.resolve(promptDir, "input_clarification_gate_lite_v1_1.md"));

  // 3. Ghi tài liệu input của sinh viên
  for (const file of opts.inputFiles) {
    const target = path.resolve(inputDir, file.name);
    if (Buffer.isBuffer(file.content)) {
      writeFileSync(target, file.content);
    } else {
      writeFileSync(target, file.content, "utf-8");
    }
  }

  // 4. Khởi chạy tiến trình OMP CLI
  const selectedModel = opts.model || process.env.OMP_MODEL || "cheapkeyai/gemini-3.8-flash";
  const prompt = `Hãy đọc tệp AGENTS.md để nắm vững quy trình và tiêu chuẩn thẩm định 2 bước (Fixed Two-Step Workflow). Đọc tài liệu nhóm trong input/, tra cứu đối chiếu kiến thức trong knowledge/startup_knowledge.db. Sau đó thực hiện chuẩn xác Step 1 xuất output/triad_handoff_packet.md, rồi Step 2 xuất output/input_clarification_audit.md và output/report.json.`;

  const args = [
    "--mode", "json",
    "-p", prompt,
    "--cwd", jobDir,
    "--model", selectedModel,
    "--auto-approve",
    "--approval-mode", "yolo",
    "--no-session",
  ];

  logger.info({ caseId: opts.caseId, selectedModel }, "Spawning OMP CLI process...");

  await new Promise<void>((resolve, reject) => {
    const proc = spawn("omp", args, {
      cwd: jobDir,
      env: { ...process.env, LANG: "C.UTF-8" },
      shell: true,
    });

    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`OMP process exited with code ${code}`));
    });
  });

  // 5. Đọc kết quả xuất bản từ sandbox
  const reportJsonPath = path.resolve(outputDir, "report.json");
  const reportMdPath = path.resolve(outputDir, "input_clarification_audit.md");

  const reportJson = JSON.parse(readFileSync(reportJsonPath, "utf-8"));
  const reportMarkdown = readFileSync(reportMdPath, "utf-8");

  // 6. Biên dịch sang PDF bằng Typst
  const pdfBuffer = await compileMarkdownToTypstPdf(reportMarkdown, {
    projectName: opts.projectName,
    overallScore: reportJson.overallScore,
    verdict: reportJson.verdict,
  });

  return { reportJson, reportMarkdown, pdfBuffer };
}
```

### Bước 2.3: Bê Nguyên xi Typst Engine từ Sandbox
Sao chép toàn bộ thư mục:
- `E:\Workspace\test-agent-sanbox-web\apps\api\src\mdNormalizer.ts` $\rightarrow$ `apps/api/src/modules/reports/infrastructure/pdf/mdNormalizer.ts`
- `E:\Workspace\test-agent-sanbox-web\apps\api\src\mdToTypst.ts` $\rightarrow$ `apps/api/src/modules/reports/infrastructure/pdf/mdToTypst.ts`
- `E:\Workspace\test-agent-sanbox-web\apps\api\src\typstRunner.ts` $\rightarrow$ `apps/api/src/modules/reports/infrastructure/pdf/typstRunner.ts`
- `E:\Workspace\test-agent-sanbox-web\apps\api\src\pdfService.ts` $\rightarrow$ `apps/api/src/modules/reports/infrastructure/pdf/pdfService.ts`
- `E:\Workspace\test-agent-sanbox-web\apps\api\src\templates\report.typ` $\rightarrow$ `apps/api/src/modules/reports/infrastructure/pdf/templates/report.typ`
- `E:\Workspace\test-agent-sanbox-web\apps\api\src\fonts\Merriweather\` $\rightarrow$ `apps/api/src/modules/reports/infrastructure/pdf/fonts/Merriweather/`

---

## 4. Tiêu chí Chấp thuận (Verification)
- Chạy thử hàm `runOmpAudit` với dữ liệu mẫu từ nhóm `0001_26`.
- Xác nhận OMP CLI mở `startup_knowledge.db` tra cứu lỗi, xuất thành công `output/report.json` và `output/input_clarification_audit.md`.
- File PDF Typst biên dịch ra đạt chuẩn A4 vector, dung lượng ~43KB.
