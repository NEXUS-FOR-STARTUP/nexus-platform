/**
 * Backfill Report: Decouple content_md (Markdown) and metadata_json (JSONB)
 *
 * Scans all reports in the database:
 * - If content_md is JSON containing `reportMarkdown`:
 *   - Updates content_md with the pure Markdown string.
 *   - Extracts non-markdown fields (scores, criteria, projectName, etc.) into metadata_json.
 * - If content_md is already Markdown, keeps it intact.
 *
 * Usage:
 *   npx tsx scripts/migrate-report-metadata.ts
 *   npx tsx scripts/migrate-report-metadata.ts --dry-run
 */

import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

// Load root .env
loadEnv({ path: resolve(process.cwd(), ".env") });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL not set in .env. Aborting.");
  process.exit(1);
}

const isDryRun = process.argv.includes("--dry-run");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  console.log(`[Report Migration] Starting... (dryRun: ${isDryRun})`);

  const reports = await prisma.report.findMany({
    select: {
      id: true,
      case_id: true,
      report_type: true,
      status: true,
      content_md: true,
      metadata_json: true,
      created_at: true,
    },
    orderBy: { created_at: "asc" },
  });

  console.log(`[Report Migration] Found ${reports.length} total reports.`);

  let migratedCount = 0;
  let alreadyPureCount = 0;
  let skippedCount = 0;

  for (const report of reports) {
    const trimmed = report.content_md.trim();
    const isJsonLike = trimmed.startsWith("{") && trimmed.endsWith("}");

    if (!isJsonLike) {
      console.log(`[Report Migration] Report ${report.id} (case ${report.case_id}) is already pure markdown (len: ${trimmed.length}).`);
      alreadyPureCount++;
      continue;
    }

    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed.reportMarkdown === "string" && parsed.reportMarkdown.trim().length > 0) {
        const pureMarkdown = parsed.reportMarkdown;
        // Strip out reportMarkdown to prevent data duplication in metadata_json
        const { reportMarkdown: _, ...metadata } = parsed;

        console.log(
          `[Report Migration] Migrating report ${report.id} (case ${report.case_id}): pure md len ${pureMarkdown.length}, metadata keys: [${Object.keys(metadata).join(", ")}]`
        );

        if (!isDryRun) {
          await prisma.report.update({
            where: { id: report.id },
            data: {
              content_md: pureMarkdown,
              metadata_json: metadata,
            },
          });
        }
        migratedCount++;
      } else {
        console.warn(
          `[Report Migration] Report ${report.id} contains JSON without reportMarkdown property. Keys: [${Object.keys(parsed).join(", ")}]. Skipping content_md change.`
        );
        // If metadata_json is empty, store the parsed object
        if (!report.metadata_json && !isDryRun) {
          await prisma.report.update({
            where: { id: report.id },
            data: {
              metadata_json: parsed,
            },
          });
          console.log(`[Report Migration] Populated metadata_json for report ${report.id}.`);
        }
        skippedCount++;
      }
    } catch (err) {
      console.error(`[Report Migration] Error parsing JSON for report ${report.id}:`, err);
      skippedCount++;
    }
  }

  console.log(`\n[Report Migration] Summary:`);
  console.log(`- Total: ${reports.length}`);
  console.log(`- Migrated from JSON -> MD + metadata_json: ${migratedCount}`);
  console.log(`- Already pure Markdown: ${alreadyPureCount}`);
  console.log(`- Skipped/Warned: ${skippedCount}`);
}

main()
  .catch((err) => {
    console.error("[Report Migration] Fatal error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
