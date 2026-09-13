import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, delimiter } from "node:path";

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

export const OMP_BIN = process.env.OMP_BIN || "omp";
export const DEFAULT_MODEL = process.env.OMP_MODEL || "cheapkeyai/gemini-3.8-flash";

/**
 * Resolve the agent runtime to an absolute executable path.
 * Why: on Windows, `spawn("bun")` resolves via PATH to the npm `bun.cmd`
 * shim, and Node 22+ refuses argv containing cmd.exe special characters
 * (the `-p` prompt always contains parentheses) for .bat/.cmd targets.
 * Pointing at the real bun.exe avoids cmd.exe entirely. Non-Windows keeps
 * PATH lookup so Docker/Linux behavior is unchanged.
 */
export function resolveAgentRuntime(): { runCmd: string; baseArgs: string[] } {
  const OMP_CLI = resolve(
    process.env.USERPROFILE || "",
    ".bun/install/global/node_modules/@oh-my-pi/pi-coding-agent/dist/cli.js",
  );
  if (process.platform === "win32") {
    if (existsSync(OMP_CLI)) {
      const bunExe = findWindowsExe("bun");
      if (bunExe) return { runCmd: bunExe, baseArgs: [OMP_CLI] };
    }
    return { runCmd: findWindowsExe("omp") ?? OMP_BIN, baseArgs: [] };
  }
  const isDirectCli = existsSync(OMP_CLI);
  return { runCmd: isDirectCli ? "bun" : OMP_BIN, baseArgs: isDirectCli ? [OMP_CLI] : [] };
}

/**
 * Find a real `.exe` for `name` on Windows, skipping `.cmd`/`.bat` shims.
 * Checks the app's own install dir first, then PATH entries in order.
 */
function findWindowsExe(name: string): string | null {
  const home = process.env.USERPROFILE || "";
  const dirs: string[] = [];
  if (name === "bun" && home) dirs.push(resolve(home, ".bun", "bin"));
  if (name === "omp" && home) dirs.push(resolve(home, ".bun", "bin"));
  for (const dir of (process.env.PATH || "").split(delimiter)) {
    if (dir) dirs.push(dir);
  }
  for (const dir of dirs) {
    const exe = resolve(dir, `${name}.exe`);
    if (existsSync(exe)) return exe;
  }
  return null;
}

export function getProvidersPath(): string {
  const p1 = resolve(ROOT_DIR, "data/providers.json");
  if (existsSync(p1)) return p1;
  const p2 = resolve(process.env.USERPROFILE || "", ".omp/agent/models.json");
  if (existsSync(p2)) return p2;
  return resolve(ROOT_DIR, "scripts/providers.json");
}

export function syncAgentProviders(): void {
  try {
    const providersSrc = getProvidersPath();
    if (!existsSync(providersSrc)) return;
    const content = readFileSync(providersSrc);
    const home = process.env.USERPROFILE || process.env.HOME || "/root";
    const userAgentDir = resolve(home, ".omp", "agent");
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
