import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

export const REDIS_HOST = process.env.REDIS_HOST || "127.0.0.1";
export const REDIS_PORT = Number(process.env.REDIS_PORT || 6379);
export const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;

export function resolveRepoRoot(): string {
  let current = process.cwd();
  for (let i = 0; i < 4; i++) {
    if (existsSync(resolve(current, "data/knowledge/startup_knowledge.db"))) {
      return current;
    }
    const parent = resolve(current, "..");
    if (parent === current) break;
    current = parent;
  }
  return process.cwd();
}

export const ROOT_DIR = resolve(process.env.APP_ROOT || resolveRepoRoot());
export const STORAGE_DIR = process.env.STORAGE_DIR
  ? resolve(process.env.STORAGE_DIR)
  : resolve(ROOT_DIR, "storage");

export const DEFAULT_MODEL = process.env.OMP_MODEL || "mimo/mimo-v2.5";

/**
 * Resolve the agent runtime for Linux container execution.
 * Checks global pi-coding-agent CLI via Bun first, falls back to "omp" binary in PATH.
 */
export function resolveAgentRuntime(): { runCmd: string; baseArgs: string[] } {
  const homeDir = process.env.HOME || "/root";
  const ompCli = resolve(
    homeDir,
    ".bun/install/global/node_modules/@oh-my-pi/pi-coding-agent/dist/cli.js"
  );
  const isDirectCli = existsSync(ompCli);
  return {
    runCmd: isDirectCli ? "bun" : "omp",
    baseArgs: isDirectCli ? [ompCli] : [],
  };
}

export function getProvidersPath(): string {
  const p1 = resolve(ROOT_DIR, "data/providers.json");
  if (existsSync(p1)) return p1;
  const homeDir = process.env.HOME || "/root";
  const p2 = resolve(homeDir, ".omp/agent/models.json");
  if (existsSync(p2)) return p2;
  return resolve(ROOT_DIR, "scripts/providers.json");
}

export function syncAgentProviders(): void {
  try {
    const providersSrc = getProvidersPath();
    if (!existsSync(providersSrc)) return;
    const content = readFileSync(providersSrc);
    const homeDir = process.env.HOME || "/root";
    const userAgentDir = resolve(homeDir, ".omp", "agent");
    mkdirSync(userAgentDir, { recursive: true });
    writeFileSync(resolve(userAgentDir, "models.json"), content);
  } catch {
    // Silently ignore if read-only mount
  }
}

export const PROMPT_CONFIG: Record<"full" | "lite", readonly string[]> = {
  full: ["triad_framework_v1_1.md", "input_clarification_gate_v4_1.md"],
  lite: ["triad_framework_v1_1.md", "input_clarification_gate_lite_v1_1.md"],
} as const;
