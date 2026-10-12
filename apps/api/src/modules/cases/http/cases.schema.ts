import { Cp1IntakeSchema, CreateProjectSchema } from "@repo/validation";

type ErrorCollectingSchema = {
  safeParse: (body: unknown) =>
    | { success: true; data: unknown }
    | { success: false; error: { issues: { message: string }[] } };
};

function collectIssues(schema: ErrorCollectingSchema, body: unknown): string[] {
  if (!body) {
    return ["Dữ liệu trống"];
  }

  const result = schema.safeParse(body);
  if (result.success) {
    return [];
  }

  return result.error.issues.map((issue) => issue.message);
}

/** Full intake payload: `POST /cases/:id/intake`. */
export function validateCp1Intake(body: unknown): string[] {
  return collectIssues(Cp1IntakeSchema, body);
}

/** Project shell payload: `POST /cases`. */
export function validateCreateProject(body: unknown): string[] {
  return collectIssues(CreateProjectSchema, body);
}
