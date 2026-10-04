import { Cp1IntakeSchema } from "@repo/validation";

export function validateCp1Intake(body: unknown): string[] {
  if (!body) {
    return ["Dữ liệu trống"];
  }

  const result = Cp1IntakeSchema.safeParse(body);
  if (result.success) {
    return [];
  }

  return result.error.issues.map((issue) => issue.message);
}
