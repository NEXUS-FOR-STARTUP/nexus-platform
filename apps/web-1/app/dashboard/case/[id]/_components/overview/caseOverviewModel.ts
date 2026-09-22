import {
  TEAM_FIT_AREA_STATE_LABELS,
  TEAM_FIT_LEVEL_LABELS,
  TEAM_FIT_VERDICT_LABELS,
  TeamFitFreeReportSchema,
} from "@repo/validation";

type RecordValue = Record<string, unknown>;

function asRecord(value: unknown): RecordValue | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as RecordValue) : null;
}

export interface OverviewArea {
  ten: string;
  trangThaiLabel: string;
  mucDoLabel: string;
  isWeak: boolean;
  lyDo: string;
  danChung: string;
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function textList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(text).filter((item): item is string => item !== null);
  }

  const single = text(value);
  return single ? [single] : [];
}



/**
 * Reads a stored result_snapshot in either shape: the v2 three-part report
 * (verdict + areas) or the legacy {teamGaps, commercialGaps} lists.
 */
export function mapTeamFitReportResult(resultSnapshot: unknown): {
  verdictLabel: string | null;
  areas: OverviewArea[];
  teamGaps: string[];
  commercialGaps: string[];
} {
  const parsed = TeamFitFreeReportSchema.safeParse(resultSnapshot);
  const ai = parsed.success ? parsed.data.ai : null;
  const raw = asRecord(resultSnapshot);

  return {
    verdictLabel: ai ? TEAM_FIT_VERDICT_LABELS[ai.verdict] : null,
    areas: ai
      ? ai.areas.map((area) => ({
          ten: area.ten,
          trangThaiLabel: TEAM_FIT_AREA_STATE_LABELS[area.trangThai],
          mucDoLabel: TEAM_FIT_LEVEL_LABELS[area.mucDo],
          isWeak: area.trangThai === "yeu",
          lyDo: area.lyDo,
          danChung: area.danChung,
        }))
      : [],
    teamGaps: textList(raw?.teamGaps),
    commercialGaps: textList(raw?.commercialGaps),
  };
}

