import { defineConfig } from "tsup";

// Self-contained (zod inlined) so the sandbox needs no node_modules; runs under the worker's bun.
export default defineConfig({
  entry: { "validate-cp2-report": "src/cli/validate-cp2-report.ts" },
  format: ["esm"],
  outExtension: () => ({ js: ".mjs" }),
  noExternal: ["zod"],
  platform: "node",
  dts: false,
  clean: false,
});
