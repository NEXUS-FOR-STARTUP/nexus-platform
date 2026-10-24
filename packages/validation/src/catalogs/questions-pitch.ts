import type { Question } from "./types.js";

// ---------------------------------------------------------------------------
// Pitch deck questions, sections 1-5 of the 10-section demo pitch (introduction, problem,
// solution, market, business model). Sections 6-10 are in questions-pitch-plan.ts and the
// appendices (elevator pitch, extras, Q&A rehearsal) in questions-pitch-appendix.ts.
// One question group per slide, so the docx doubles as the slide-by-slide script a team
// turns into its own deck.
// Same wording convention as questions-cp3.ts: one-line purpose → "Cần nêu"
// bullets → one "Không đạt" / "Đạt" pair. Examples use one running project
// (study-group booking near campus) as illustration only.
// Criterion labels in the docx are hints from the sample marking table, not scores.
// ---------------------------------------------------------------------------

export const PITCH_QUESTIONS = {
  // ── 1. Giới thiệu ─────────────────────────────────────────────────────────

  pitch_vision_mission: {
    id: "pitch_vision_mission",
    text: "Tầm nhìn và sứ mệnh của dự án là gì?",
    explanation:
      "Mở bài bằng điều nhóm muốn thay đổi, không bằng lời chào dài. Cần nêu:\n" +
      "- Tầm nhìn: dự án muốn thay đổi điều gì sau 3 đến 5 năm\n" +
      "- Sứ mệnh: mỗi ngày nhóm làm gì để tiến tới tầm nhìn đó\n" +
      "Không đạt: \"Trở thành nền tảng số một Việt Nam.\"\n" +
      "Đạt: \"Tầm nhìn: mọi sinh viên tìm được chỗ học phù hợp trong hai phút. " +
      "Sứ mệnh: cập nhật bàn trống của các quán quanh trường mỗi ngày và cho giữ bàn ngay trong ứng dụng.\"",
    suggested_actions: ["Tầm nhìn khớp với vấn đề và nhóm khách hàng ở các mục sau."],
  },

  // ── 2. Vấn đề ─────────────────────────────────────────────────────────────

  pitch_pmf_problem: {
    id: "pitch_pmf_problem",
    text: "Vấn đề của khách hàng là gì và bằng chứng nào cho thấy vấn đề có thật?",
    explanation:
      "Nêu vấn đề bằng số liệu từ khách thật, không bằng cảm giác của nhóm. Cần nêu:\n" +
      "- Vấn đề là gì và ai gặp\n" +
      "- Mức nghiêm trọng: mất bao nhiêu thời gian hoặc tiền\n" +
      "- Bằng chứng: số người khảo sát hoặc phỏng vấn, tỷ lệ, một trích dẫn tiêu biểu\n" +
      "Không đạt: \"Sinh viên khó tìm chỗ học.\"\n" +
      "Đạt: \"Sinh viên hay học nhóm quanh trường mất trung bình 25 phút nhắn hỏi từng quán mới có chỗ. " +
      "Khảo sát 120 sinh viên, 78% gặp tình trạng này mỗi tuần.\"",
    suggested_actions: ["Có ít nhất một con số khảo sát hoặc phỏng vấn đi kèm."],
  },

  // ── 3. Giải pháp ──────────────────────────────────────────────────────────

  pitch_pmf_solution_tech: {
    id: "pitch_pmf_solution_tech",
    text: "Giải pháp và công nghệ nhóm dùng là gì, và vì sao phù hợp?",
    explanation:
      "Hội đồng muốn thấy yếu tố công nghệ của giải pháp. Cần nêu:\n" +
      "- Giải pháp giải quyết vấn đề bằng cơ chế nào\n" +
      "- Công nghệ và công cụ chính, kèm lý do chọn\n" +
      "- Phần nào nhóm tự làm, phần nào dùng dịch vụ có sẵn\n" +
      "Không đạt: \"Một ứng dụng giúp sinh viên tìm chỗ học.\"\n" +
      "Đạt: \"Ứng dụng web nhận bàn trống từ các quán đối tác theo thời gian thực và cho giữ bàn trong 10 phút. " +
      "Nhóm tự làm phần đồng bộ bàn trống, dùng cổng thanh toán có sẵn.\"",
    suggested_actions: ["Người nghe không chuyên kỹ thuật vẫn hiểu giải pháp hoạt động ra sao."],
  },

  pitch_pmf_usp: {
    id: "pitch_pmf_usp",
    text: "Lợi thế khác biệt (USP) của nhóm là gì và vì sao khó sao chép?",
    explanation:
      "Một câu USP rõ ràng, kèm lý do nhóm đi trước. Cần nêu:\n" +
      "- Một câu USP\n" +
      "- Lợi thế đến từ đâu: dữ liệu, công nghệ, quan hệ, quy trình hoặc thời điểm\n" +
      "- Nếu rào cản thấp, nhóm đi trước bằng cách nào\n" +
      "Không đạt: \"Giao diện đẹp, dễ dùng.\"\n" +
      "Đạt: \"Giữ được bàn trống thật của quán quanh trường. Khó sao chép vì nhóm đã ký thỏa thuận chia sẻ dữ liệu bàn với 5 quán.\"",
    suggested_actions: ["Đối thủ lớn hơn đọc USP vẫn khó làm theo trong một năm."],
  },

  pitch_pmf_responsible_ai_legal: {
    id: "pitch_pmf_responsible_ai_legal",
    text: "Dự án xử lý thế nào các vấn đề đạo đức, pháp lý và dùng AI có trách nhiệm?",
    explanation:
      "Nói thật những gì nhóm đã làm và chưa làm. Cần nêu:\n" +
      "- Rủi ro về dữ liệu cá nhân, bản quyền, quy định ngành và cách kiểm soát\n" +
      "- Nếu có dùng AI: AI làm phần nào, con người chịu trách nhiệm phần nào, nhóm công khai điều đó với người dùng ra sao\n" +
      "- Nếu không dùng AI: ghi rõ \"Không dùng AI\"\n" +
      "Không đạt: \"Nhóm tuân thủ pháp luật.\"\n" +
      "Đạt: \"Chỉ lưu tên và số điện thoại để giữ bàn, xóa sau 30 ngày, có hộp đồng ý khi đăng ký. " +
      "Không dùng AI trong phần đặt bàn.\"",
    suggested_actions: ["Có ít nhất một quy tắc nhóm tự đặt ra và đang tuân thủ."],
  },

  // ── 4. Thị trường ─────────────────────────────────────────────────────────

  pitch_pmf_market_size: {
    id: "pitch_pmf_market_size",
    text: "Quy mô thị trường (TAM, SAM, SOM) và khả năng mở rộng ra sao?",
    explanation:
      "Tính từ dưới lên (bottom-up) và nói rõ nhóm lớn thêm bằng cách nào. Cần nêu:\n" +
      "- TAM, SAM, SOM kèm cách tính và nguồn số liệu\n" +
      "- SAM tính từ nhóm khách nhóm thật sự tiếp cận được\n" +
      "- Dự án mở rộng sang khu vực, nhóm khách hay sản phẩm nào tiếp theo\n" +
      "Không đạt: \"Thị trường 10 nghìn tỷ.\"\n" +
      "Đạt: \"SAM: 60.000 sinh viên quanh 3 trường ở Thủ Đức, mỗi người đặt 2 lượt mỗi tháng. " +
      "SOM năm đầu: 1%, tức 600 người. Mở rộng sang các khu đại học khác ở thành phố.\"",
    suggested_actions: ["Mỗi con số có nguồn hoặc phép tính, khớp với doanh thu ở mục Mô hình kinh doanh."],
  },

  pitch_pmf_competitors: {
    id: "pitch_pmf_competitors",
    text: "Đối thủ và giải pháp thay thế là gì, nhóm khác họ ở điểm nào?",
    explanation:
      "Kể cả cách khách đang tự xoay xở. Cần nêu:\n" +
      "- Đối thủ trực tiếp, gián tiếp và cách làm thủ công hiện nay\n" +
      "- Vài tiêu chí khách quan tâm để so sánh\n" +
      "- Vị trí của nhóm so với từng đối thủ\n" +
      "Không đạt: \"Chưa có đối thủ.\"\n" +
      "Đạt: \"Trực tiếp: ứng dụng đặt chỗ của từng quán. Gián tiếp: nhắn hỏi quán qua Facebook. " +
      "Khác ở chỗ xem một lượt bàn trống của nhiều quán và giữ bàn trong 10 phút.\"",
    suggested_actions: ["Có cả đối thủ vô hình (khách không dùng gì hoặc làm thủ công)."],
  },

  // ── 5. Mô hình kinh doanh ─────────────────────────────────────────────────

  pitch_bm_canvas_summary: {
    id: "pitch_bm_canvas_summary",
    text: "Tóm tắt Business Model Canvas của dự án.",
    explanation:
      "Hội đồng hay hỏi về mô hình kinh doanh, nên nên có một slide canvas. Cần nêu:\n" +
      "- Khách hàng, giá trị, kênh, quan hệ khách hàng\n" +
      "- Doanh thu, nguồn lực, hoạt động, đối tác, chi phí\n" +
      "- Điều quan trọng nhất trong chín ô\n" +
      "Không đạt: \"Như đã nộp.\"\n" +
      "Đạt: \"Khách: sinh viên học nhóm quanh trường. Giá trị: giữ bàn trong 10 phút. Doanh thu: hoa hồng và gói thành viên. " +
      "Đối tác then chốt: 5 quán. Quan trọng nhất: dữ liệu bàn trống của quán.\"",
    suggested_actions: ["Chín ô khớp với nhau, nhất là khách hàng, giá trị và doanh thu."],
  },

  pitch_bm_revenue: {
    id: "pitch_bm_revenue",
    text: "Dự án thu tiền từ đâu và với mức giá bao nhiêu?",
    explanation:
      "Nội dung này nằm ở phần Tài chính, bài pitch dùng lại để nhóm không phải viết hai nơi. Cần nêu:\n" +
      "- Nguồn thu chính\n" +
      "- Đơn vị tính và mức giá\n" +
      "- Mức giá dựa vào đâu\n" +
      "Không đạt: \"Bán ứng dụng cho sinh viên.\"\n" +
      "Đạt: \"Thu hoa hồng 8% mỗi lượt đặt bàn, khoảng 9.600 đồng mỗi lượt, và gói thành viên 29.000 đồng mỗi tháng. " +
      "Giá thử nghiệm dựa trên khảo sát 25 sinh viên.\"",
    suggested_actions: ["Mỗi nguồn thu có đơn vị tính và con số giá."],
  },
} satisfies Record<string, Question>;
