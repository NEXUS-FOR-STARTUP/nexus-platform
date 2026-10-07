# Technical Implementation Guidelines: Guided Documents CP1/CP2

**Ngữ cảnh:** Hướng dẫn kỹ thuật này dành cho các agent/developer thực thi dự án Guided Documents dựa trên kiến trúc 1 Bảng (Ponytail). Tài liệu này được tổng hợp từ việc scan codebase hiện tại của dự án Nexus (Hono, TanStack, Mantine).

---

## 1. Backend (Hono)

### Cấu trúc thư mục (Clean Architecture)
Module mới sẽ nằm tại: `apps/api/src/modules/guided-documents/`
- `http/guided-documents.routes.ts`: Khai báo Hono Router.
- `http/guided-documents.controller.ts`: Lấy session, gọi Use Case, trả JSON.
- `http/guided-documents.schema.ts`: Dùng Zod để validate input.
- `application/*.usecase.ts`: Các hàm logic xử lý chính (Lấy DB, Import AI, Sinh DOCX).
- `templates/cp1.ts`, `templates/cp2.ts`: Định nghĩa mảng câu hỏi hardcode.

### Validation (Zod)
- Ưu tiên khai báo Zod Schema ở `packages/validation/src/guided-documents.ts` để chia sẻ type với Frontend.
- **Tại Controller:** Dự án KHÔNG dùng `@hono/zod-validator`. Pattern chuẩn là dùng `Schema.safeParse(body)` trực tiếp trong code handler. Trả về mảng lỗi nếu `!success` (Tham khảo `cases.schema.ts` hoặc `admin-workers.controller.ts`).

### Cloudinary & Xử lý File (DOCX/PDF)
- Nhúng Cloudinary qua Service chuẩn: `import { uploadFile } from "../../../services/cloudinary.js"`.
- Để render DOCX từ code, thêm package `docx` vào `apps/api`: `bun add docx`. Không cần lưu ra ổ cứng ảo, tạo buffer trên RAM rồi đẩy thẳng hàm `uploadFile`.
- **Vercel AI SDK**: KHÔNG import trực tiếp `@ai-sdk/google` trong module. Sử dụng module service chuẩn của dự án: `import { getGoogleModel } from "../../../services/google-provider.js"`. Dùng `generateObject` từ package `ai` kết hợp Zod schema (JSON output strict).

---

## 2. Frontend (Next.js & Mantine)

### Cấu trúc thư mục
- Nằm tại: `apps/web-1/app/(authenticated)/cases/[id]/` (hoặc chèn trực tiếp vào Workspace của Case).
- Convention: Dùng tham số query `?tab=guided-docs` để điều hướng mà không làm mất trạng thái page. Gating bằng `if (activeTab === 'guided-docs')`.

### Xây dựng Form (TanStack Form + Mantine v9)
- Khởi tạo form: `const form = useForm({...})`.
- Hydration (Điền data có sẵn từ DB): Dùng `useEffect` gọi `form.reset(newData)` khi API GET trả về.
- Mantine Integration: Wrap ô text bằng component `form.Field`. Bắt lỗi bằng:
  ```tsx
  const hasError = field.state.meta.isTouched && field.state.meta.errors.length > 0;
  // <Textarea error={hasError ? field.state.meta.errors[0] : undefined} />
  ```
- **Lưu ý Crash TanStack Form v1:** Luôn dùng `mutate(payload)` của TanStack Query trong hàm `onSubmit`. **Tuyệt đối không dùng `mutateAsync`** vì nó sẽ bắn unhandled promise rejection nếu API lỗi.

### Data Fetching (TanStack Query)
- Tất cả API fetch đều dùng `apiClient` từ `@/lib/api-client`.
- Wrap query và mutation vào custom hooks: `hooks/useGuidedDocuments.ts`.
- Khi user nhấn Save (Mutation Success), bắt buộc gọi: `queryClient.invalidateQueries({ queryKey: ["guided-documents", caseId] })`.
- Hiển thị Toast thông báo: `notifications.show({ title: 'Đã lưu', color: 'green' })`.

### Khóa 1 chiều (UI Logic)
- Mỗi câu hỏi (QuestionDef) sẽ kiểm tra logic mở khóa.
- Hàm check (Pseudo-code):
  ```tsx
  const isUnlocked = !question.unlock_requires || 
                     question.unlock_requires.every(reqId => (form.getFieldValue(reqId) || '').trim().length > 0);
  ```
- Ô nhập bị khóa sẽ truyền props `disabled={!isUnlocked}` và làm mờ giao diện. Sẽ không dùng cờ lỗi `needs_review` nào.
