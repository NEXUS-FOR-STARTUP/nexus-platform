import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
let cachedTypstBin: string | null = null;

export function _resetTypstBinaryCache(): void {
  cachedTypstBin = null;
}

/**
 * Resolve the path to the Typst CLI binary.
 * Priority: TYPST_PATH env → .bin/typst (postinstall) → system PATH → raw "typst" fallback.
 * Throws a clear error message with install instructions if not found.
 */
export function resolveTypstBinary(): string {
  if (cachedTypstBin) {
    return cachedTypstBin;
  }

  // 1. Explicit env override
  if (process.env.TYPST_PATH && existsSync(process.env.TYPST_PATH)) {
    cachedTypstBin = process.env.TYPST_PATH;
    return cachedTypstBin;
  }

  const exeName = process.platform === "win32" ? "typst.exe" : "typst";

  // 2. Candidate directories
  const candidates = [
    resolve(__dirname, "..", ".bin", exeName),
    resolve(__dirname, "..", "..", "..", "..", ".bin", exeName),
    resolve(process.cwd(), "apps", "api", ".bin", exeName),
    resolve(process.cwd(), ".bin", exeName),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      cachedTypstBin = candidate;
      return cachedTypstBin;
    }
  }

  // 3. System PATH lookup
  try {
    const cmd =
      process.platform === "win32" ? "where typst" : "which typst";
    const out = execSync(cmd, {
      stdio: ["pipe", "pipe", "ignore"],
      timeout: 3000,
    })
      .toString()
      .trim()
      .split(/\r?\n/)[0];
    if (out && existsSync(out)) {
      cachedTypstBin = out;
      return cachedTypstBin;
    }
  } catch {
    // not found in PATH
  }

  // 4. Fallback — let caller handle the error
  cachedTypstBin = "typst";
  return cachedTypstBin;
}

/**
 * Check if the resolved Typst binary is actually reachable.
 * Returns true if `typst --version` exits cleanly.
 */
export function isTypstAvailable(binPath: string): boolean {
  try {
    execSync(`${binPath} --version`, {
      stdio: ["pipe", "pipe", "ignore"],
      timeout: 5000,
    });
    return true;
  } catch {
    return false;
  }
}
