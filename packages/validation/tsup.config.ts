import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  // `clean` wipes dist, including the sandbox validator; rebuild it after every main build (also in watch mode).
  onSuccess: "tsup --config tsup.cli.config.ts",
});
