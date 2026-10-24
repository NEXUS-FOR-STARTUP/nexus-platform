import type { Question } from "./types.js";

// Pitch deck appendices: A elevator pitch (60 seconds), B extra content for the submission, C Q&A rehearsal. Same wording convention as questions-pitch.ts.

export const PITCH_APPENDIX_QUESTIONS = {
  // ── Phụ lục A. Elevator pitch 60 giây ─────────────────────────────────────

  pitch_who: {
    id: "pitch_who",
    text: "Nhóm là ai và đang làm gì?",
    explanation:
      "Elevator pitch dài khoảng 60 giây, không định giá, khảo sát hay persona. Nhóm tự viết lại ngắn gọn từ mục 1 và mục 2. Cần nêu:\n" +
      "- Tên dự án và lĩnh vực\n" +
      "- Nhóm khách hàng chính\n" +
      "Không đạt: \"Chúng tôi làm một ứng dụng.\"\n" +
      "Đạt: \"Chúng tôi là StudySpot, giúp sinh viên học nhóm quanh trường tìm và giữ bàn trống trong vài giây.\"",
    suggested_actions: ["Đọc to trong 10 giây mà không vấp."],
  },

  pitch_problem_solution: {
    id: "pitch_problem_solution",
    text: "Vấn đề là gì và nhóm giải quyết bằng cách nào?",
    explanation:
      "Nhóm tự viết lại ngắn gọn từ mục 2 và mục 3. Cần nêu:\n" +
      "- Nỗi đau của khách, kèm một con số nếu có\n" +
      "- Cách giải quyết khác biệt của nhóm, không dùng thuật ngữ người ngoài ngành không hiểu\n" +
      "Không đạt: \"Sinh viên khó tìm chỗ học nên chúng tôi làm ứng dụng.\"\n" +
      "Đạt: \"Sinh viên mất 25 phút nhắn từng quán mới có chỗ học. Chúng tôi cho xem bàn trống của nhiều quán và giữ bàn trong 10 phút.\"",
    suggested_actions: ["Một người ngoài ngành đọc xong vẫn nhắc lại được vấn đề."],
  },

  pitch_call_to_action: {
    id: "pitch_call_to_action",
    text: "Nhóm kêu gọi người nghe làm gì?",
    explanation:
      "Một câu cuối, nhóm tự viết lại ngắn gọn từ mục 10. Cần nêu:\n" +
      "- Mong muốn cụ thể ở người nghe\n" +
      "- Việc họ làm được ngay\n" +
      "Không đạt: \"Mong mọi người quan tâm.\"\n" +
      "Đạt: \"Nếu bạn là chủ quán gần khu đại học, hãy kết nối với chúng tôi để thử giữ bàn miễn phí một tháng.\"",
    suggested_actions: ["Tổng ba câu đọc khoảng 60 giây."],
  },

  // ── Phụ lục B. Bổ sung cho bài nộp ───────────────────────────────────────

  pitch_op_roadmap: {
    id: "pitch_op_roadmap",
    text: "Lộ trình vận hành theo từng giai đoạn ra sao?",
    explanation:
      "Chia giai đoạn theo thời gian, giai đoạn gần nhất đủ cụ thể để làm ngay. Cần nêu:\n" +
      "- Mục tiêu và việc chính từng giai đoạn\n" +
      "- Người phụ trách\n" +
      "- Chỉ số đo được\n" +
      "Không đạt: \"Phát triển dần theo thời gian.\"\n" +
      "Đạt: \"Quý này: ký thêm 3 quán, đạt 150 người dùng, Bình phụ trách. Quý sau: mở thu phí gói thành viên, đạt 100 người trả tiền.\"",
    suggested_actions: ["Mỗi giai đoạn có một chỉ số đo được."],
  },

  pitch_op_risks: {
    id: "pitch_op_risks",
    text: "Những rủi ro lớn nhất là gì và nhóm kiểm soát thế nào?",
    explanation:
      "Hội đồng thường hỏi câu này, nên viết sẵn. Cần nêu:\n" +
      "- 3 đến 5 rủi ro lớn nhất: thị trường, kỹ thuật, tài chính, pháp lý, nhân sự\n" +
      "- Khả năng xảy ra và mức ảnh hưởng\n" +
      "- Phương án giảm thiểu\n" +
      "Không đạt: \"Rủi ro là cạnh tranh.\"\n" +
      "Đạt: \"Quán đối tác ngừng chia sẻ dữ liệu bàn: khả năng trung bình, ảnh hưởng cao. Giảm thiểu: ký thỏa thuận một năm và cho quán nhập tay khi cần.\"",
    suggested_actions: ["Có ít nhất một rủi ro từ đối thủ hoặc phụ thuộc bên thứ ba."],
  },

  // ── Phụ lục C. Chuẩn bị hỏi đáp ───────────────────────────────────────────

  pitch_qa_team: {
    id: "pitch_qa_team",
    text: "Nhóm thiếu năng lực gì để đi tiếp sau môn học, và ai ở lại làm?",
    explanation:
      "Hội đồng hay hỏi câu này để biết dự án có sống tiếp không. Cần nêu:\n" +
      "- Điểm thiếu lớn nhất của nhóm\n" +
      "- Ai cam kết làm tiếp sau môn học\n" +
      "- Nếu có người rút, ai thay\n" +
      "Không đạt: \"Cả nhóm sẽ làm tiếp.\"\n" +
      "Đạt: \"Thiếu người bán hàng với quán. An và Bình cam kết làm tiếp, hai bạn còn lại hỗ trợ bán thời gian. Nếu Bình rút thì thuê lập trình viên ngoài.\"",
    suggested_actions: ["Có tên người và việc cụ thể, không chỉ nói cả nhóm."],
  },

  pitch_qa_market: {
    id: "pitch_qa_market",
    text: "Vì sao khách chuyển sang nhóm, và thị trường lớn thêm bằng cách nào?",
    explanation:
      "Trả lời được ba việc thì hội đồng khó hỏi tiếp. Cần nêu:\n" +
      "- Khách đang giải quyết vấn đề bằng cách nào hiện nay (đối thủ, tự làm, không làm gì) và vì sao họ chuyển sang nhóm\n" +
      "- Rào cản nào khiến người khác khó làm giống\n" +
      "- Thị trường lớn thêm bằng cách nào\n" +
      "Không đạt: \"Vì sản phẩm của chúng tôi tốt hơn.\"\n" +
      "Đạt: \"Khách đang nhắn hỏi từng quán, mất 25 phút. Nhóm rút còn 20 giây. Rào cản là thỏa thuận dữ liệu với 5 quán. " +
      "Mở thêm khu đại học ở Dĩ An và Quận 9.\"",
    suggested_actions: ["Có lý do khách chuyển sang, không chỉ nói sản phẩm tốt."],
  },

  pitch_qa_model: {
    id: "pitch_qa_model",
    text: "Ai trả tiền, trả bao nhiêu, và bằng chứng nào cho thấy họ sẽ trả?",
    explanation:
      "Câu hỏi nhóm hay bị hỏi lại. Cần nêu:\n" +
      "- Ai là người trả tiền\n" +
      "- Mức giá\n" +
      "- Bằng chứng: số người đã trả hoặc cam kết trả\n" +
      "Không đạt: \"Sinh viên sẽ trả vì tiện.\"\n" +
      "Đạt: \"Quán trả hoa hồng 8% mỗi lượt, 3 quán đã ký thử một tháng. Sinh viên trả 29.000 đồng mỗi tháng, 9 người đã mua gói thử nghiệm.\"",
    suggested_actions: ["Bằng chứng là hành động trả tiền thật, không phải ý định."],
  },

  pitch_qa_operation: {
    id: "pitch_qa_operation",
    text: "Rủi ro lớn nhất trong 12 tháng tới là gì, và nếu xảy ra thì nhóm làm gì?",
    explanation:
      "Chọn một rủi ro thật và có kịch bản. Cần nêu:\n" +
      "- Rủi ro lớn nhất\n" +
      "- Dấu hiệu để nhận ra sớm\n" +
      "- Việc nhóm làm ngay khi xảy ra\n" +
      "Không đạt: \"Không có rủi ro lớn.\"\n" +
      "Đạt: \"Quán đối tác rút. Dấu hiệu: số bàn cập nhật giảm hai tuần liên tục. Nhóm chuyển sang cho quán nhập tay và ký thêm hai quán thay thế.\"",
    suggested_actions: ["Có dấu hiệu nhận biết, không chỉ có phương án xử lý."],
  },

  pitch_qa_funding: {
    id: "pitch_qa_funding",
    text: "Vì sao cần số vốn này (hoặc vì sao không cần), vốn từ đâu, và dòng tiền âm kéo dài bao lâu?",
    explanation:
      "Trả lời bằng số, khớp với phần Tài chính. Cần nêu:\n" +
      "- Vì sao đúng số vốn này, hoặc vì sao không cần vốn ngoài\n" +
      "- Nguồn vốn\n" +
      "- Dòng tiền âm kéo dài bao nhiêu tháng\n" +
      "Không đạt: \"Cần thêm vốn để phát triển nhanh.\"\n" +
      "Đạt: \"Nhóm góp 50 triệu, đủ cho khoản lỗ lũy kế lớn nhất 42 triệu. Dòng tiền âm 12 tháng, sau đó tự chạy bằng doanh thu.\"",
    suggested_actions: ["Con số khớp với file Excel P&L."],
  },
} satisfies Record<string, Question>;
