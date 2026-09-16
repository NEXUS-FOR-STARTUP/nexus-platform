import type { BenchmarkMetrics } from "./metrics.js";
export type AgentType = 'omp' | 'pi' | 'both';

export type JobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface CategoryScores {
  problemClarity: number; // 0 - 100
  marketViability: number; // 0 - 100
  businessModel: number; // 0 - 100
  competitiveMoat: number; // 0 - 100
  executionFeasibility: number; // 0 - 100
}

export interface WeaknessItem {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  sectionOrSlide: string;
  rootCause: string;
  matchedCommonMistake?: string;
  recommendation: string;
}

export interface StartupReport {
  projectName: string;
  overallScore: number; // 0 - 100
  verdict?: 'NOT READY FOR REALITY CHECK' | 'PARTIALLY READY FOR REALITY CHECK' | 'READY FOR REALITY CHECK' | string;
  executiveSummary: string;
  categoryScores: CategoryScores;
  fieldStatuses?: Array<{
    field: string;
    status: 'Clear' | 'Missing' | 'Too vague' | 'Mixed frame' | 'Unsupported claim' | string;
    note?: string;
  }>;
  keyStrengths: string[];
  criticalWeaknesses: WeaknessItem[];
  mandatoryQuestions?: string[];
  actionPlan: string[];
}

export * from "./metrics.js";

export interface AgentExecutionResult {
  agent: 'omp' | 'pi';
  status: 'completed' | 'failed' | 'cancelled';
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  metrics?: BenchmarkMetrics;
  modelUsed?: string;
  reportMarkdown?: string; // Input Clarification Audit (Step 2)
  triadPacketMarkdown?: string; // Triad Handoff Packet (Step 1)
  reportJson?: StartupReport;
  rawLogs: string;
  error?: string;
}

export interface EvaluationJob {
  id: string;
  title: string;
  documentPath: string;
  documentOriginalName: string;
  requestedAgent: AgentType;
  model?: string;
  ompModel?: string;
  piModel?: string;
  promptMode?: 'full' | 'lite';
  createdAt: string;
  status: JobStatus;
  ompStatus?: JobStatus;
  piStatus?: JobStatus;
  results: {
    omp?: AgentExecutionResult;
    pi?: AgentExecutionResult;
  };
  logs: Array<{
    timestamp: string;
    agent?: 'omp' | 'pi' | 'system';
    message: string;
  }>;
}

export interface CreateJobInput {
  title?: string;
  agentType: AgentType;
  model?: string;
  ompModel?: string;
  piModel?: string;
  promptMode?: 'full' | 'lite';
  promptInstructions?: string;
}

export interface ModelOption {
  id: string; // e.g. "cheapkeyai/gemini-3.8-flash", "mimo-anthropic/mimo-v2.5"
  name: string;
  providerId: string;
  providerName: string;
  protocol: string;
  contextWindow: number;
  maxTokens: number;
  speedRank: string;
  recommendedFor: 'omp' | 'pi' | 'both';
  description: string;
}

export interface CommonErrorRecord {
  id: number;
  category: string;
  errorName: string;
  description: string;
  frequencyPercent: number;
  typicalSymptom: string;
  recommendedFix: string;
}
