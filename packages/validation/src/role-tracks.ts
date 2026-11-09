// ---------------------------------------------------------------------------
// Team role tracks — shared code ↔ label map (FE + BE)
// Lives outside index.ts so pre-cp1 catalogs can import it without a cycle.
// ---------------------------------------------------------------------------

export const ROLE_TRACK_CODES = [
  "ky_thuat",
  "marketing",
  "kinh_doanh_tai_chinh",
] as const;

export type RoleTrackCode = (typeof ROLE_TRACK_CODES)[number];

export const ROLE_TRACK_LABELS: Record<RoleTrackCode, string> = {
  ky_thuat: "Kỹ thuật",
  marketing: "Marketing",
  kinh_doanh_tai_chinh: "Kinh doanh – Tài chính",
};
