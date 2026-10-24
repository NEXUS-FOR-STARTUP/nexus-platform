/**
 * Student-facing journey stages. Single source for display names, URL slugs,
 * order and the service each stage is graded with. "CPn" is internal only and
 * must never be shown in the UI.
 */
export const STAGES = [
  { code: "CP1", slug: "y-tuong", name: "Ý tưởng", serviceType: "cp1_audit", templateKey: "cp1", available: true },
  { code: "CP2", slug: "thi-truong", name: "Thị trường", serviceType: "cp2_audit", templateKey: "cp2", available: true },
  { code: "CP3", slug: "san-pham-mo-hinh", name: "Mô hình kinh doanh", serviceType: "cp3_audit", templateKey: "cp3", available: true },
  { code: "CP4", slug: "goi-von-tai-chinh", name: "Gọi vốn & tài chính", serviceType: null, templateKey: "cp4", available: false },
] as const;

export type StageDefinition = (typeof STAGES)[number];
export type StageCode = StageDefinition["code"];
export type StageSlug = StageDefinition["slug"];

export function findStageByCode(code: string): StageDefinition | undefined {
  return STAGES.find((stage) => stage.code === code);
}

export function findStageBySlug(slug: string): StageDefinition | undefined {
  return STAGES.find((stage) => stage.slug === slug);
}

export function findStageByServiceType(serviceType: string): StageDefinition | undefined {
  return STAGES.find((stage) => stage.serviceType === serviceType);
}
