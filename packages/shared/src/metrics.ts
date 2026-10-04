import pidusage from "pidusage";
import { readdirSync, statSync, existsSync } from "fs";
import { resolve, join } from "path";
import type { StartupReport } from "./index.js";

export interface SystemResourceMetrics {
  peakMemoryMb: number;
  finalMemoryMb: number;
  avgCpuPercent: number;
  peakCpuPercent: number;
  durationMs: number;
  sampleCount: number;
  workspaceSizeKb: number;
  reportMdSizeKb: number;
  vpsRecommendation: string;
  estimatedMaxConcurrentOn2GB: number;
  estimatedMaxConcurrentOn4GB: number;
  estimatedComputeCostUsd: number;
}

export interface ReportQualityMetrics {
  reportWordCount: number;
  generationSpeedWordsPerSec: number;
  weaknessCount: number;
  criticalWeaknessCount: number;
  knowledgeMatchCount: number;
  knowledgeMatchPercent: number;
  jsonCompliance: boolean;
  estimatedTokens: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    costUsdGeminiFlash: number;
    costUsdClaudeSonnet: number;
  };
}

export interface BenchmarkMetrics {
  system: SystemResourceMetrics;
  quality: ReportQualityMetrics;
}

function getDirectorySize(dirPath: string): number {
  if (!existsSync(dirPath)) return 0;
  let totalBytes = 0;
  try {
    const entries = readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);
      if (entry.isDirectory()) {
        totalBytes += getDirectorySize(fullPath);
      } else if (entry.isFile()) {
        totalBytes += statSync(fullPath).size;
      }
    }
  } catch {
    // Ignore transient access errors
  }
  return totalBytes;
}

export class ProcessResourceTracker {
  private pid: number;
  private workspaceDir: string;
  private intervalId: NodeJS.Timeout | null = null;
  private samples: Array<{ cpu: number; memory: number }> = [];
  private peakMemoryBytes = 0;
  private peakCpu = 0;
  private startTime = 0;

  constructor(pid: number, workspaceDir: string) {
    this.pid = pid;
    this.workspaceDir = workspaceDir;
  }

  public start(intervalMs = 400): void {
    this.startTime = Date.now();
    this.intervalId = setInterval(async () => {
      try {
        const stats = await pidusage(this.pid);
        this.samples.push({ cpu: stats.cpu, memory: stats.memory });
        if (stats.memory > this.peakMemoryBytes) {
          this.peakMemoryBytes = stats.memory;
        }
        if (stats.cpu > this.peakCpu) {
          this.peakCpu = stats.cpu;
        }
      } catch {
        // Process might have exited
      }
    }, intervalMs);
  }

  public async stop(
    reportMdContent?: string,
    reportJson?: StartupReport,
    inputDocumentContent?: string
  ): Promise<BenchmarkMetrics> {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    // Try unregistering from pidusage
    try {
      pidusage.clear();
    } catch {
      // Ignore
    }

    const durationMs = Math.max(100, Date.now() - this.startTime);
    const durationSec = durationMs / 1000;

    // Calculate CPU averages
    let totalCpu = 0;
    let finalMemoryBytes = 0;
    if (this.samples.length > 0) {
      for (const s of this.samples) {
        totalCpu += s.cpu;
      }
      finalMemoryBytes = this.samples[this.samples.length - 1].memory;
    }

    const avgCpuPercent = this.samples.length > 0
      ? Math.round((totalCpu / this.samples.length) * 10) / 10
      : 0;

    const peakMemoryMb = Math.max(25, Math.round((this.peakMemoryBytes / (1024 * 1024)) * 10) / 10);
    const finalMemoryMb = Math.max(15, Math.round((finalMemoryBytes / (1024 * 1024)) * 10) / 10);
    const peakCpuPercent = Math.round(this.peakCpu * 10) / 10;

    // Workspace disk size
    const workspaceBytes = getDirectorySize(this.workspaceDir);
    const workspaceSizeKb = Math.round(workspaceBytes / 1024);

    const reportMdPath = resolve(this.workspaceDir, "output", "report.md");
    const reportMdSizeKb = existsSync(reportMdPath)
      ? Math.round(statSync(reportMdPath).size / 1024)
      : Math.round((reportMdContent?.length || 0) / 1024);

    // VPS capacity calculations
    // Base reserve: OS + Docker daemon + Hono API + Redis consumes ~600MB on 2GB, ~800MB on 4GB
    const availableRam2GB = Math.max(200, 2048 - 600);
    const availableRam4GB = Math.max(400, 4096 - 800);
    const estimatedMaxConcurrentOn2GB = Math.max(1, Math.floor(availableRam2GB / peakMemoryMb));
    const estimatedMaxConcurrentOn4GB = Math.max(2, Math.floor(availableRam4GB / peakMemoryMb));

    // Server hourly cost based on a standard $10/month VPS (720 hours/month => $0.0138/hr => $0.00000385/sec)
    const vpsSecondCostUsd = 10 / (720 * 3600);
    const estimatedComputeCostUsd = Number((durationSec * vpsSecondCostUsd).toFixed(6));

    let vpsRecommendation = "";
    if (peakMemoryMb < 250) {
      vpsRecommendation = `Rất nhẹ (~${peakMemoryMb}MB RAM). VPS 1 vCPU - 2GB RAM đủ tải mượt mà 3-5 jobs đồng thời.`;
    } else if (peakMemoryMb < 500) {
      vpsRecommendation = `Mức tiêu thụ trung bình (~${peakMemoryMb}MB RAM). Khuyến nghị VPS 2 vCPU - 4GB RAM cho 4-6 jobs đồng thời.`;
    } else {
      vpsRecommendation = `Tiêu tốn bộ nhớ cao (~${peakMemoryMb}MB RAM). Khuyến nghị VPS 4 vCPU - 8GB RAM.`;
    }

    const systemMetrics: SystemResourceMetrics = {
      peakMemoryMb,
      finalMemoryMb,
      avgCpuPercent,
      peakCpuPercent,
      durationMs,
      sampleCount: this.samples.length,
      workspaceSizeKb,
      reportMdSizeKb,
      vpsRecommendation,
      estimatedMaxConcurrentOn2GB,
      estimatedMaxConcurrentOn4GB,
      estimatedComputeCostUsd,
    };

    // Quality & Economics Metrics
    const reportText = reportMdContent || JSON.stringify(reportJson || "");
    const words = reportText.trim().split(/\s+/).filter(Boolean);
    const reportWordCount = words.length;
    const generationSpeedWordsPerSec = durationSec > 0
      ? Math.round((reportWordCount / durationSec) * 10) / 10
      : 0;

    const weaknesses = reportJson?.criticalWeaknesses || [];
    const weaknessCount = weaknesses.length;
    const criticalWeaknessCount = weaknesses.filter((w: any) => w.severity === "critical").length;
    const knowledgeMatchCount = weaknesses.filter((w: any) => Boolean(w.matchedCommonMistake?.trim())).length;
    const knowledgeMatchPercent = weaknessCount > 0
      ? Math.round((knowledgeMatchCount / weaknessCount) * 100)
      : 0;

    // Token estimation
    const inputWords = (inputDocumentContent || "").trim().split(/\s+/).filter(Boolean).length;
    // System prompt + AGENTS.md + knowledge base is ~2500 words
    const estimatedInputTokens = Math.round((inputWords + 2500) * 1.35);
    const estimatedOutputTokens = Math.round(reportWordCount * 1.35);
    const totalTokens = estimatedInputTokens + estimatedOutputTokens;

    // Gemini 2.5 Flash: $0.75 per 1M input, $3.75 per 1M output
    const costGemini = (estimatedInputTokens / 1_000_000) * 0.75 + (estimatedOutputTokens / 1_000_000) * 3.75;
    // Claude Sonnet 3.5/3.7: $3.00 per 1M input, $15.00 per 1M output
    const costClaude = (estimatedInputTokens / 1_000_000) * 3.00 + (estimatedOutputTokens / 1_000_000) * 15.00;

    const qualityMetrics: ReportQualityMetrics = {
      reportWordCount,
      generationSpeedWordsPerSec,
      weaknessCount,
      criticalWeaknessCount,
      knowledgeMatchCount,
      knowledgeMatchPercent,
      jsonCompliance: Boolean(reportJson && reportJson.overallScore !== undefined),
      estimatedTokens: {
        inputTokens: estimatedInputTokens,
        outputTokens: estimatedOutputTokens,
        totalTokens,
        costUsdGeminiFlash: Number(costGemini.toFixed(5)),
        costUsdClaudeSonnet: Number(costClaude.toFixed(5)),
      },
    };

    return {
      system: systemMetrics,
      quality: qualityMetrics,
    };
  }
}
