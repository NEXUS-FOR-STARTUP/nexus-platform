import { IdeaInputSchema } from "@repo/validation";

// ── Constants ──

export const INITIAL_BLANKS: Record<string, string> = {
  projectName: "",
  field: "",
  targetCustomer: "",
  problem: "",
  solution: "",
  mvp: "",
};

const FIELD_LABELS: Record<string, string> = {
  projectName: "Tên dự án",
  field: "Lĩnh vực",
  targetCustomer: "Khách hàng mục tiêu",
  problem: "Vấn đề",
  solution: "Giải pháp",
  mvp: "MVP",
};

const TEAM_LABELS: Record<string, string> = {
  major: "Chuyên ngành",
  strengths: "Sở trường",
  experience: "Kinh nghiệm",
};

// ── Helpers ──

function translateIssue(key: string, message: string): string {
  const label = FIELD_LABELS[key] ?? key;

  const minMatch = message.match(/have >=(\d+)/);
  if (minMatch) {
    const n = parseInt(minMatch[1]!, 10);

    if (key === "problem")
      return `Mô tả vấn đề cần ít nhất ${n} ký tự — hãy viết cụ thể hơn`;
    if (key === "solution")
      return `Mô tả giải pháp cần ít nhất ${n} ký tự — hãy viết cụ thể hơn`;
    if (key === "targetCustomer")
      return `Khách hàng mục tiêu cần ít nhất ${n} ký tự — ai là người bạn muốn giúp?`;
    if (key === "mvp")
      return `Mô tả MVP cần ít nhất ${n} ký tự — sản phẩm đầu tiên trông như thế nào?`;
    return `${label} cần ít nhất ${n} ký tự`;
  }

  const maxMatch = message.match(/have <=(\d+)/);
  if (maxMatch) {
    return `${label} tối đa ${maxMatch[1]} ký tự — hãy rút gọn`;
  }

  if (message === "Required") return `${label} không được để trống`;
  return `${label}: ${message}`;
}

/** Validate a single MadLibs field against IdeaInputSchema. Returns error message or null. */
export function validateBlank(key: string, value: string): string | null {
  const fieldSchema =
    IdeaInputSchema.shape[key as keyof typeof IdeaInputSchema.shape];
  if (!fieldSchema) return null;
  const result = fieldSchema.safeParse(value);
  if (result.success) return null;
  return translateIssue(key, result.error.issues[0]?.message ?? "");
}

/** Validate all blanks, return a map of errors. */
export function validateAllBlanks(
  blanks: Record<string, string>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const key of Object.keys(blanks)) {
    const error = validateBlank(key, blanks[key] ?? "");
    if (error) errors[key] = error;
  }
  return errors;
}

/**
 * Translate raw Zod issue to student-friendly Vietnamese using full path context.
 */
export function formatIssue(
  path: (string | symbol | number)[],
  message: string,
): string {
  const lastKey = path[path.length - 1];

  // ---- Idea field errors (MadLibs) ----
  if (path[0] === "idea" && typeof lastKey === "string") {
    return translateIssue(lastKey, message);
  }

  // ---- Team member field errors ----
  const teamIdx = path.indexOf("team");
  if (teamIdx !== -1 && path[teamIdx + 1] !== undefined) {
    const memberNum = (path[teamIdx + 1] as number) + 1; // 0-based → 1-based
    const fieldKey = path[teamIdx + 2] as string | undefined;
    const subIdx = path[teamIdx + 3];

    if (fieldKey) {
      const label = TEAM_LABELS[fieldKey] ?? fieldKey;
      const sub = typeof subIdx === "number" ? ` mục thứ ${subIdx + 1}` : "";

      const minMatch = message.match(/have >=(\d+)/);
      if (minMatch) {
        const n = parseInt(minMatch[1]!, 10);
        return `Thành viên ${memberNum} — ${label}${sub}: cần ít nhất ${n} ký tự`;
      }
      const maxMatch = message.match(/have <=(\d+)/);
      if (maxMatch) {
        return `Thành viên ${memberNum} — ${label}${sub}: tối đa ${maxMatch[1]} ký tự`;
      }
      if (message === "Required" || message.includes("Required")) {
        return `Thành viên ${memberNum} — ${label}: không được để trống`;
      }
      if (message.includes("Too small") && message.includes("array")) {
        return `Thành viên ${memberNum} — ${label}: cần ít nhất 1 mục`;
      }
      return `Thành viên ${memberNum} — ${label}${sub}: ${message}`;
    }

    // Array-level (team member object itself)
    return `Thành viên ${memberNum} có thông tin chưa hợp lệ. Vui lòng kiểm tra lại.`;
  }

  // ---- Fallback ----
  return translateIssue(
    typeof lastKey === "string" ? lastKey : String(lastKey),
    message,
  );
}
