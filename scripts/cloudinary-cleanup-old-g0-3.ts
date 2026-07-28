#!/usr/bin/env -S npx tsx

/**
 * Cloudinary Cleanup: Old Gói 0-3 Case Documents
 *
 * Deletes Cloudinary files for document_records linked to old package cases
 * (NOT pkg_tf_free or pkg_tf_audit). Preserves free-tier and audit-tier data.
 *
 * Usage:
 *   npx tsx scripts/cloudinary-cleanup-old-g0-3.ts           # real deletion
 *   npx tsx scripts/cloudinary-cleanup-old-g0-3.ts --dry-run # preview only
 */

import { prisma } from "../apps/api/src/db.js";
import { deleteFile } from "../apps/api/src/services/cloudinary.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CleanupRecord {
  id: string;
  cloudinaryPublicId: string;
  caseId: string;
}

interface CleanupStats {
  total: number;
  cleaned: number;
  errors: { publicId: string; caseId: string; message: string }[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseArgs(): { dryRun: boolean } {
  const args = process.argv.slice(2);
  return { dryRun: args.includes("--dry-run") };
}

async function fetchRecords(): Promise<CleanupRecord[]> {
  const rows = await prisma.documentRecord.findMany({
    where: {
      source_kind: "cloudinary",
      cloudinary_public_id: { not: null },
      case: {
        package_id: {
          notIn: ["pkg_tf_free", "pkg_tf_audit"],
        },
      },
    },
    select: {
      id: true,
      cloudinary_public_id: true,
      case_id: true,
    },
  });

  return rows.map((r) => ({
    id: r.id,
    cloudinaryPublicId: r.cloudinary_public_id as string,
    caseId: r.case_id,
  }));
}

function label(r: CleanupRecord): string {
  return `[case=${r.caseId}] ${r.cloudinaryPublicId}`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const { dryRun } = parseArgs();

  if (dryRun) {
    console.log("[DRY RUN] No files will be deleted. Preview only.\n");
  } else {
    console.log("[LIVE RUN] Cloudinary files will be permanently deleted.\n");
  }

  const records = await fetchRecords();

  const stats: CleanupStats = {
    total: records.length,
    cleaned: 0,
    errors: [],
  };

  console.log(`Found ${stats.total} document_record(s) with Cloudinary files to clean.\n`);

  if (stats.total === 0) {
    console.log("Nothing to do.");
    await prisma.$disconnect();
    return;
  }

  for (const record of records) {
    const lbl = label(record);

    if (dryRun) {
      console.log(`[WOULD DELETE] ${lbl}`);
      stats.cleaned++;
      continue;
    }

    try {
      await deleteFile(record.cloudinaryPublicId);
      console.log(`[OK] ${lbl}`);
      stats.cleaned++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[ERROR] ${lbl}: ${message}`);
      stats.errors.push({
        publicId: record.cloudinaryPublicId,
        caseId: record.caseId,
        message,
      });
    }
  }

  // Summary
  console.log(`\n--- Summary ---`);
  console.log(`Total found : ${stats.total}`);
  console.log(`Cleaned     : ${stats.cleaned}`);
  console.log(`Errors      : ${stats.errors.length}`);

  if (stats.errors.length > 0) {
    console.log(`\nError details:`);
    for (const e of stats.errors) {
      console.log(`  [case=${e.caseId}] ${e.publicId}`);
      console.log(`    ${e.message}`);
    }
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("Fatal error:", e);
  prisma.$disconnect().finally(() => process.exit(1));
});
