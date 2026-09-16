# Phase 1: Hợp đồng dữ liệu & Chuẩn hóa Danh mục tài liệu

## 1. Mục tiêu
Chuẩn hóa Schema validation chung (`packages/validation`) và logic xử lý backend liên quan. Giải phóng trường `support_needs` khỏi ràng buộc bắt buộc, cập nhật danh mục tài liệu theo chuẩn UX Pro Max (đơn nghĩa, cấm `/`, `()`, `&`), duy trì fallback và chuẩn hóa category key (canonicalize key) để tránh trùng lặp accordion UI ở workspace tài liệu.

## 2. Các tệp tin tác động
- `packages/validation/src/index.ts`
- `apps/api/src/modules/admin/application/list-admin-cases.usecase.ts`
- `apps/api/src/shared/infrastructure/tests/cp1-intake-validation.test.ts`
- `apps/api/src/shared/infrastructure/tests/document-supersede.test.ts`
- `apps/web-1/app/dashboard/case/[id]/_components/documents/document-groups.ts`
- `apps/web-1/app/dashboard/case/[id]/_components/documents/document-workspace.types.ts`

## 3. Chi tiết thực hiện

### Bước 1: Chuẩn hóa `DOCUMENT_CATEGORY_CODES`, Canonical Key & Fallback trong `packages/validation/src/index.ts`
1. Khai báo danh mục mới (đơn nghĩa, cấm `/`, `()`, `&`):
```typescript
export const DOCUMENT_CATEGORY_CODES = [
  "idea_report",
  "pitch_deck",
  "market_research",
  "financial_plan",
  "other",
] as const;

export type DocumentCategoryCode = (typeof DOCUMENT_CATEGORY_CODES)[number];

const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategoryCode, string> = {
  idea_report: "Thuyết minh ý tưởng",
  pitch_deck: "Slide thuyết trình",
  market_research: "Nghiên cứu thị trường",
  financial_plan: "Kế hoạch tài chính",
  other: "Tài liệu bổ sung",
};

// Canonical key mapping: gộp các code cũ về key chuẩn để tránh trùng accordion groups
export const LEGACY_CATEGORY_CANONICAL_MAP: Record<string, DocumentCategoryCode> = {
  competitor_analysis: "market_research",
  customer_research: "market_research",
};

export const LEGACY_DOCUMENT_CATEGORY_LABELS: Record<string, string> = {
  competitor_analysis: "Nghiên cứu thị trường",
  customer_research: "Nghiên cứu thị trường",
  task_assignment: "Đề cương phân công",
};

export function canonicalizeDocCategory(code: string | null | undefined): string {
  if (!code) return "other";
  return LEGACY_CATEGORY_CANONICAL_MAP[code] ?? code;
}

export function docCategoryLabel(code: string): string {
  if (code in DOCUMENT_CATEGORY_LABELS) {
    return DOCUMENT_CATEGORY_LABELS[code as DocumentCategoryCode];
  }
  if (code in LEGACY_DOCUMENT_CATEGORY_LABELS) {
    return LEGACY_DOCUMENT_CATEGORY_LABELS[code];
  }
  return code;
}
```

2. Đồng bộ hiển thị nhóm tài liệu tại `apps/web-1/app/dashboard/case/[id]/_components/documents/`:
- Tại `document-workspace.types.ts` & `document-groups.ts`:
  Sử dụng `canonicalizeDocCategory(file.category)` khi gán `categoryKey` thay vì dùng raw `file.category`. Đảm bảo file cũ `competitor_analysis` và `customer_research` gom chung vào 1 accordion duy nhất mang tên "Nghiên cứu thị trường", không bị render 2 accordion trùng lặp.

### Bước 2: Nới lỏng `Cp1IntakeSchema` trong `packages/validation/src/index.ts`
1. Chuyển `support_needs` và `primary_need` thành optional:
```typescript
  // 3. Support needs validation (tùy chọn, không bắt buộc)
  const supportNeeds = data.support_needs;
  if (supportNeeds && typeof supportNeeds === 'object') {
    const primaryNeed = (supportNeeds as Record<string, unknown>).primary_need;
    if (typeof primaryNeed === 'string' && primaryNeed.trim().length > 0 && primaryNeed.trim().length < 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Nhu cầu hỗ trợ chính nếu có phải từ 5 ký tự trở lên",
        path: ["support_needs", "primary_need"]
      });
    }
  }
```
2. `addCp1CapIssues` đã có guard clause an toàn nên giữ nguyên, chỉ check cap khi có text.

### Bước 3: Điều chỉnh tính completeness trong `list-admin-cases.usecase.ts`
1. Cập nhật hàm `completenessFromIntake` nhận thêm tham số `packageId?: string | null`:
```typescript
function completenessFromIntake(contentRaw: string | null | undefined, packageId?: string | null): number {
  if (!contentRaw) return 0;
  try {
    const content = JSON.parse(contentRaw);
    const isAiOnly = packageId === "pkg_ai_audit";
    const hasLegacyContext =
      hasText(content.case_summary, 20) ||
      (Array.isArray(content.current_situations) &&
        content.current_situations.some((entry: unknown) => hasText(entry, 1)));

    if (isAiOnly) {
      // 4 tiêu chí cốt lõi, mỗi tiêu chí 25% (tổng 100%)
      const aiChecks = [
        hasText(content.contact?.full_name, 2) && hasText(content.contact?.email, 1),
        hasText(content.current_blocker, 10) || hasLegacyContext,
        Array.isArray(content.documents) && content.documents.length > 0,
        Array.isArray(content.boundary_confirmations) && content.boundary_confirmations.length > 0,
      ];
      return aiChecks.filter(Boolean).length * 25;
    }

    // Gói có Supporter: 5 tiêu chí, mỗi tiêu chí 20%
    const checks = [
      hasText(content.contact?.full_name, 2) && hasText(content.contact?.email, 1),
      hasText(content.support_needs?.primary_need, 5),
      hasText(content.current_blocker, 10) || hasLegacyContext,
      Array.isArray(content.documents) && content.documents.length > 0,
      Array.isArray(content.boundary_confirmations) && content.boundary_confirmations.length > 0,
    ];
    return checks.filter(Boolean).length * 20;
  } catch {
    return 0;
  }
}
```
2. Tại `listAdminCasesUseCase`: truyền `item.package?.id || item.package_id` vào `completenessFromIntake`.

### Bước 4: Cập nhật Unit Tests
- Cập nhật `cp1-intake-validation.test.ts`:
  - Thêm test case cho payload không có `support_needs` $\rightarrow$ Pass.
  - Sửa các test case âm bản (negative tests) trước đây mong đợi lỗi `Cần chọn nhu cầu hỗ trợ chính` khi `support_needs` rỗng thành test trường hợp gửi `primary_need` quá ngắn (<5 ký tự).
  - Test kiểm tra tính tương thích ngược và hàm `canonicalizeDocCategory`.
- `document-supersede.test.ts` giữ nguyên (đã verified an toàn).
