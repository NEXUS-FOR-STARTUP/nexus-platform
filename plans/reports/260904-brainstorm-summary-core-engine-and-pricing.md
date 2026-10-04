# Báo Cáo Tổng Hợp Brainstorm: Tái Cấu Trúc Gói Dịch Vụ, Lõi Đánh Giá AI & Quản Lý System Prompt

- **Ngày lập:** 2026-09-04
- **Tác giả:** Solution Brainstormer
- **Mục đích:** Đóng gói toàn bộ các luận điểm cốt lõi đã thống nhất từ phiên thảo luận ngày 2026-09-04, làm nền tảng cho việc thảo luận chi tiết các bước triển khai kỹ thuật tiếp theo.

---

## 1. Căn Cứ Thực Tế & Động Lực Thay Đổi (The "Why")

- **Nguồn chứng cứ lịch sử**:
  - `E:\FPT\Semester_7\EXE101\DEMO PITCHING\Tham khảo chuẩn bị demo pitching.docx`
  - `E:\FPT\Semester_7\EXE101\DEMO PITCHING\Tham khảo (2).docx`
- **Vấn đề đã xác định**:
  - Hội đồng chấm thử xếp Nexus 5/5 (72/100 điểm) do mô hình 39.000đ chỉ mang lại doanh thu 1,1 – 3,5 triệu VNĐ/năm, bị đánh giá là "dự án sinh viên nhỏ lẻ", không thể scale hay trang trải chi phí vận hành.
  - Mức giá 39.000đ tự hạ thấp giá trị chất xám, trong khi thù lao reviewer thẩm định thực tế là 80.000đ/giờ (Nexus đang bù lỗ tiền túi trên mỗi ca có người đọc duyệt).
- **Chỉ đạo chiến lược từ Mentor**:
  - Khai tử mức giá 39.000đ.
  - Tách thành 2 gói trả phí: Gói tự động hóa AI thuần và Gói có chuyên gia kiểm duyệt.
  - Chuyển con người từ người viết chính sang **Người kiểm duyệt cuối cùng (Final Reviewer)** để giải phóng nút thắt năng suất.

---

## 2. Thiết Kế 2 Gói Dịch Vụ Mới

| Tiêu chí | Gói 1: Basic AI Audit (`pkg_ai_audit`) | Gói 2: Premium Mentor Audit (`pkg_supporter_audit`) |
| :--- | :--- | :--- |
| **Mức giá niêm yết** | **79.000 VNĐ / lượt** | **149.000 VNĐ / lượt** (hoặc 199.000 VNĐ) |
| **Giá chia đầu người (nhóm 5)** | **~15.000 – 16.000 VNĐ / bạn** (rẻ hơn ổ bánh mì) | **~30.000 VNĐ / bạn** (bằng 1 ly trà sữa) |
| **Bản chất thực thi** | 100% AI phân tích tự động theo rubric FPTU. | Người + AI: AI tạo draft $\rightarrow$ Mentor FPT duyệt & ký. |
| **Cam kết thời gian (SLA)** | Tức thì (**30 giây – 1 phút**), bỏ qua hàng chờ. | **24 giờ – 48 giờ**. |
| **Biên lợi nhuận gộp** | **> 95%** (Chi phí API LLM ~2.000đ/lần). | **46% – 60%** (Lãi gộp 69.000đ – 119.000đ/case). |
| **Đối tượng phù hợp** | Nhóm nộp bài gấp, cần quét lỗi khung sườn nhanh. | Nhóm nhắm điểm 8–9, cần mentor chỉ lỗi và xếp ưu tiên. |

---

## 3. Tiêu Chuẩn Minh Bạch & Lượng Hóa Thành Điểm Số (Scorecard)

- **Giải quyết bài toán "Qualify một lượt đánh giá"**:
  - Không để sinh viên nghi ngờ supporter phản hồi nửa vời để ép mua lượt tiếp theo.
  - Tiêu chuẩn đánh giá minh bạch đóng vai trò như một **bản hợp đồng vô hình** giữa sinh viên và supporter.
- **Cơ chế Diagnostic Scorecard**:
  - Đánh giá trên 5 tiêu chí cốt lõi:
    1. Tính khả thi của ý tưởng (Feasibility)
    2. Độ lớn & tính xác thực của vấn đề (Problem Validation / Size)
    3. Điểm khác biệt & lợi thế cạnh tranh (USP & Unfair Advantage)
    4. Năng lực đội ngũ phù hợp ý tưởng (Team-Idea Fit)
    5. Tính logic & mức độ kiểm chứng của giả định (Logical Soundness & Evidence)
  - Quy đổi thành con số trực quan (ví dụ: 55/100 - Hạng Trung bình).
  - Chứng minh giá trị dịch vụ đo lường được trước và sau khi audit (55 điểm $\rightarrow$ 85+ điểm).

---

## 4. Kiến Trúc Lõi Đánh Giá AI (`ai-engine`): Tách Biệt Syllabus & Hộp Công Cụ Phương Pháp Luận Mở

### 4.1. Chiến Lược Tách Biệt Syllabus FPT (Decoupling Strategy)
- **Vấn đề cốt tử**: Không gắn chặt tiêu chí vào giáo trình FPT để tránh bẫy "công cụ cục bộ làm bài tập cho 1 trường". Khi ra Hội đồng hoặc mở rộng thị trường (vườn ươm, cuộc thi ngoài, trường khác), hệ thống phải đứng vững bằng **các chuẩn mực quản trị & khởi nghiệp toàn cầu đã được công nhận**.
- **Tính chính danh & Đáng tin cậy (Authority & Trust)**: Trả lời đanh thép câu hỏi *"Tiêu chí này từ đâu ra để đánh giá?"*. Giảng viên và Mentor không thể phản bác khi AI đối chiếu bài làm với chính các lý thuyết kinh điển được giảng dạy tại Stanford, MIT, Harvard.

### 4.2. Hộp Công Cụ Phương Pháp Luận Mở (Open & Dynamic Methodological Toolbox)
- **Nguyên tắc "Không giới hạn"**: Không đóng đinh vào 3–5 framework cố định (không chỉ có Lean Startup, The Mom Test hay Design Thinking). Hệ thống cần linh hoạt: **gặp mô hình nào thì kích hoạt đúng công cụ của mô hình đó**:
  - *Dự án B2C / Tạo thói quen / App*: Hooked Model (Nir Eyal), Fogg Behavior Model (BJ Fogg).
  - *Dự án Sàn 2 đầu (Marketplace)*: Cold Start Problem & Chicken-and-Egg (Andrew Chen - a16z).
  - *Dự án B2B / Phần mềm doanh nghiệp*: Ideal Customer Profile (ICP), B2B Buying Center & ROI Payback.
  - *Dự án Đổi mới sáng tạo & Đề xuất giá trị*: Jobs to be Done (Clayton Christensen), Value Proposition Canvas (Strategyzer).
  - *Dự án Khảo sát nhu cầu*: The Mom Test (Rob Fitzpatrick - bẫy câu hỏi tương lai).
  - *Dự án Đo lường tài chính*: Unit Economics (CAC, LTV, Churn, Payback Period), Rule of 40.
  - *Dự án Tăng trưởng*: Crossing the Chasm (Geoffrey Moore), Pirate Metrics (AARRR).
  - *Dự án Phần cứng / DeepTech / Xã hội*: TRL (Technology Readiness Level - NASA), Theory of Change (ToC).

### 4.3. Nguyên Tắc Thẩm Định Kèm Dẫn Chứng (Explainable Assessment)
- Mọi lỗi nghiêm trọng (**BLOCKER/MAJOR**) hay điểm trừ được AI đưa ra **BẮT BUỘC** phải đi kèm 3 yếu tố:
  1. **Tên nguyên lý / lý thuyết áp dụng**.
  2. **Lý do nguyên lý này liên quan đến bản chất mô hình của dự án**.
  3. **Lỗ hổng cụ thể của nhóm khi đối chiếu với nguyên lý đó**.
- *Tác dụng*: Sinh viên học được kiến thức thật, tâm phục khẩu phục; có thể dùng chính nhận xét này để trích dẫn vào slide bảo vệ trước hội đồng.

### 4.4. Kiến Trúc Kỹ Thuật Adapter Pattern (Decoupled Rubric Engine)
- **Lõi System Prompt sạch**: Không chứa từ khóa cục bộ ("FPT", "EXE101", "Checkpoint"). Chỉ chứa các khái niệm chuẩn: *Assumption, Evidence, Problem-Solution Fit, Persona, Value Proposition, Unit Economics*.
- **Adapter Layer (Context Profiles)**:
  - *Profile A (EXE101 CP1)*: Ánh xạ tiêu chí sang: Team, Idea, Problem, Alternative, MVP, Assumptions.
  - *Profile B (EXE101 CP2)*: Kích hoạt thêm tiêu chí: Traction, Unit Economics, Go-To-Market.
  - *Profile C (Venture Pitch / Startup Competition)*: Đánh giá theo chuẩn gọi vốn thiên thần / hạt giống.

### 4.5. Luồng Thực Thi 2 Bước (`data/system-prompts/`)
1. **Bước 1 — Mở ngữ cảnh & Lập bản đồ chú ý (`workflow_operator_rule_v1` + `triad_framework_v1_1`)**:
   - Áp dụng bộ 3 lăng kính NMF–IPOD–CV để bóc tách ngữ nghĩa, phân định biến số (giả định) và hằng số (bằng chứng), xuất ra `TRIAD HANDOFF PACKET`.
2. **Bước 2 — Thẩm định chất lượng đầu vào (Input Clarification Gate)**:
   - Chạy `input_clarification_gate_lite_v1_1` (cho CP1 / Gói 79k) hoặc `input_clarification_gate_v4_1` (cho bản Full / Gói 149k) có nhúng bộ quy tắc dẫn chứng lý thuyết ở trên.
3. **Bước 3 — Hậu xử lý & Bóc tách có cấu trúc (Parser)**:
   - Trích xuất bảng trạng thái trường, danh sách lỗi cần sửa (kèm lý thuyết dẫn chiếu) và kết luận độ sẵn sàng (`READY`, `PARTIALLY READY`, `NOT READY`).
---

## 5. Kiến Trúc Lưu Trữ & Quản Lý System Prompt Chuẩn Production

Nghiên cứu qua `agy` (Gemini 3.8 Flash High) chỉ ra rằng lưu prompt thuần túy bằng lệnh UPDATE đè lên SQL là cạm bẫy gây sập parser và mất audit trail. Kiến trúc tối ưu được chọn là **Hybrid Database Deployment kết hợp In-Memory Cache và Local Fallback**:

1. **Nguyên tắc bất biến (Immutability)**:
   - Tách làm 2 bảng:
     - `SystemPrompt`: Quản lý định danh logic (`prompt_key`).
     - `SystemPromptVersion`: Quản lý nội dung, **chỉ cho phép INSERT version mới (v1, v2...), cấm lệnh UPDATE nội dung**.
   - Rollback trong 0 giây chỉ bằng việc cập nhật con trỏ version đang active.
2. **Hiệu năng & High Availability (HA)**:
   - **L1 In-Memory Cache (RAM)**: Cache prompt tại process Node.js/Hono với cơ chế Stale-While-Revalidate (TTL 5–10 phút), thời gian truy xuất **< 1ms**, triệt tiêu nguy cơ cạn kiệt connection pool của PostgreSQL.
   - **Phao cứu sinh (Static Fallback)**: Tự động xuất snapshot prompt ra tệp `fallback-prompts.generated.json` khi build Docker/CI. Nếu database gặp sự cố, hệ thống tự động rơi về fallback để pipeline AI không bao giờ trả lỗi 500.
3. **Truy vết (Observability)**:
   - Mỗi lần chạy AI trong `ai_jobs` hoặc `reports` luôn lưu kèm `prompt_version_id` để phục vụ đối soát và debug.

---

## 6. Danh Mục Các Điểm Cần Bàn Luận Chi Tiết Ở Phiên Kế Tiếp

1. **Điểm 1 — Thiết kế DDL & Migration**: Thống nhất chi tiết schema Prisma cho `SystemPrompt` và `SystemPromptVersion`, tạo migration `--create-only` an toàn.
2. **Điểm 2 — Script Ingestion / Seeding**: Viết script chuyển 5 tệp prompt từ `data/system-prompts/` vào database làm Version 1.0.
3. **Điểm 3 — Xây dựng `SystemPromptService`**: Triển khai cơ chế cache in-memory, cơ chế fallback và API lấy prompt theo key.
4. **Điểm 4 — Xây dựng `ExecuteAuditPipelineUseCase`**: Lập trình luồng gọi tuần tự Triad $\rightarrow$ Input Gate (Lite/Full) qua Vercel AI SDK / Google Provider.
5. **Điểm 5 — Cấu hình Gói Dịch Vụ & State Machine**: Cập nhật 2 gói `pkg_ai_audit` và `pkg_supporter_audit`, xóa hardcode `pkg_tf_audit` (39k) trong `upgrade-package.usecase.ts` và tích hợp bước tự động hoàn thành cho gói AI thuần.
