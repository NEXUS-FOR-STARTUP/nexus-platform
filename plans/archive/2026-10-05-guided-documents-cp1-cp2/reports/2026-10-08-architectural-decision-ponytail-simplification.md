# Architectural Decision Record (ADR): Tối giản hoá Guided Documents CP1/CP2 (Ponytail Approach)

**Ngày chốt:** 2026-10-08  
**Người chốt:** User (Lead) & Assistant (Ponytail mode)  
**Bối cảnh:** Kiến trúc thiết kế ban đầu của tính năng Guided Documents bị "over-engineered" (thiết kế quá mức cần thiết) với nhiều bảng DB, hàng đợi worker, và logic state machine phức tạp để xử lý các edge cases hiếm gặp. Chúng tôi đã review lại toàn bộ kiến trúc với tư duy lười biếng, tối giản (Ponytail mindset) để giữ lại đúng giá trị cốt lõi: "Hướng dẫn sinh viên điền form → Xuất ra file DOCX chuẩn".

Dưới đây là 5 quyết định cắt giảm kiến trúc chính thức:

## Quyết định 1: Template Builder → Hardcode trong TypeScript
- **Đã loại bỏ:** Toàn bộ ý tưởng thiết kế Admin UI, CRUD API, và Database để quản lý Template.
- **Giải pháp mới:** Hardcode cứng cấu trúc CP1 và CP2 vào file TypeScript (`cp1.ts`, `cp2.ts`).
- **Lý do:** YAGNI (You Aren't Gonna Need It). Đề bài CP1/CP2 của trường mỗi năm họa hoằn mới đổi một lần. Việc dev vào sửa file code mất 5 phút hiệu quả gấp trăm lần việc tốn hàng tuần xây dựng một hệ thống quản trị Template phức tạp (kèm logic versioning).

## Quyết định 2: Khóa phụ thuộc (Dependency) → Phương án Lai (Khóa 1 chiều)
- **Đã loại bỏ:** Cơ chế `needs_review` (vô hiệu hóa dây chuyền). Không còn việc user quay lại sửa câu A thì câu B bị báo đỏ hay bị khóa lại.
- **Giải pháp mới:** Vẫn giữ `unlock_requires` ở mức hiển thị Frontend để ép tiến độ 1 chiều. User phải điền xong A mới mở B. Nhưng một khi B đã mở, nó mở vĩnh viễn. User sửa lại A, B không bị ảnh hưởng.
- **Lý do:** Giữ được ý đồ Sư phạm (dắt tay user đi từng bước, tránh hội chứng blank-canvas paralysis gây ngợp), nhưng cắt bỏ được hoàn toàn sự phức tạp kỹ thuật (tính toán DAG, cycle detection) và sự khó chịu về UX (báo lỗi sai dây chuyền).

## Quyết định 3: Bảng lưu lịch sử (`AnswerRevision`) → Ghi đè trực tiếp
- **Đã loại bỏ:** Bảng `answer_revisions` (lưu mọi lần bấm save).
- **Giải pháp mới:** DB chỉ giữ đúng 1 bảng `ProjectAnswer` lưu nội dung (`answer_text`) mới nhất. User sửa là UPDATE (ghi đè) trực tiếp.
- **Lý do:** Snapshot vĩnh viễn của user chính là file DOCX (`DocumentRecord`) mà họ sinh ra và tải về. Việc log lại mọi keystroke/lần lưu nháp trong DB là rác dữ liệu không cần thiết.

## Quyết định 4: Bảng nháp Import (`ImportProposal`) → Stateless API
- **Đã loại bỏ:** Bảng `import_proposals` lưu trạng thái tạm thời của dữ liệu AI bóc tách từ file upload.
- **Giải pháp mới:** Chuyển Import thành Stateless API. User upload file → API gọi LLM bóc tách text → Trả thẳng cục JSON `[{question_id, text}]` về Frontend. Frontend tự map JSON vào form. User tự review bằng mắt trên form và bấm Save.
- **Lý do:** Giảm thiểu State rườm rà ở Backend. Tránh việc phải quản lý vòng đời của Proposal (pending, accepted, rejected).

## Quyết định 5: Hàng đợi sinh DOCX (BullMQ) → Đồng bộ (Synchronous)
- **Đã loại bỏ:** Cụm Worker BullMQ (`authoring-queue`) và logic polling chờ kết quả.
- **Giải pháp mới:** Route `POST /generate` chạy đồng bộ. API lấy DB → Nối text tất định qua thư viện `docx` → Upload Cloudinary → Trả về URL trong cùng 1 request.
- **Lý do:** Quyết định sản phẩm cốt lõi đã chốt là **"Merge text tất định, KHÔNG dùng AI lúc sinh tài liệu"**. Rendering file DOCX bằng code chỉ mất cỡ 50ms. Việc thiết lập Worker/Queue cho tác vụ này là quá cồng kềnh.

---

## HỆ QUẢ KIẾN TRÚC TỐI GIẢN

Từ 4 bảng Database dự kiến ban đầu, giờ **chỉ còn đúng 1 bảng duy nhất**:

```prisma
model ProjectAnswer {
  id              String   @id @default(uuid())
  case_id         String
  question_id     String   // VD: "cp1_q1"
  answer_text     String   @db.Text
  updated_at      DateTime @updatedAt
  
  @@unique([case_id, question_id])
  @@index([case_id])
  @@map("project_answers")
}
```

*Báo cáo này là kim chỉ nam cho giai đoạn triển khai Code. Cấm tự ý thêm độ phức tạp vào hệ thống.*