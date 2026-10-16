import { CaseContactInputSchema } from "@repo/validation";

export interface CaseContactValues {
  full_name: string;
  student_code: string;
  team_role: string;
  zalo: string;
  email: string;
  telegram: string;
}

export type CaseContactErrors = Partial<Record<keyof CaseContactValues, string>>;

export const EMPTY_CASE_CONTACT: CaseContactValues = {
  full_name: "",
  student_code: "",
  team_role: "",
  zalo: "",
  email: "",
  telegram: "",
};

/** Build form values from a case's own intake contact (never the account profile). */
export function contactFromSnapshot(contact: unknown): CaseContactValues {
  const c = (contact && typeof contact === "object" ? contact : {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  return {
    full_name: str(c.full_name),
    student_code: str(c.student_code),
    team_role: str(c.team_role),
    zalo: str(c.zalo),
    email: str(c.email),
    telegram: str(c.telegram),
  };
}

/** Format errors from the shared schema; `requireCore` also demands name/phone/email. */
export function validateCaseContact(values: CaseContactValues, requireCore: boolean): CaseContactErrors {
  const errors: CaseContactErrors = {};
  const parsed = CaseContactInputSchema.safeParse(values);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof CaseContactValues;
      if (key && !errors[key]) errors[key] = issue.message;
    }
  }
  if (requireCore) {
    if (!values.full_name.trim()) errors.full_name = "Vui lòng nhập họ tên người liên hệ.";
    if (!values.zalo.trim()) errors.zalo = "Vui lòng nhập số điện thoại Zalo.";
    if (!values.email.trim()) errors.email = "Vui lòng nhập email liên hệ.";
  }
  return errors;
}

const CORE_LABELS: Partial<Record<keyof CaseContactValues, string>> = {
  full_name: "họ tên",
  zalo: "số điện thoại",
  email: "email",
};

/** Labels of the core fields (name, phone, email) still missing or invalid; empty when complete. */
export function missingContactLabels(contact: unknown): string[] {
  const errors = validateCaseContact(contactFromSnapshot(contact), true);
  return (Object.keys(CORE_LABELS) as (keyof CaseContactValues)[])
    .filter((k) => errors[k])
    .map((k) => CORE_LABELS[k]!);
}
