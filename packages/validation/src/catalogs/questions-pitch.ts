import type { Question } from "./types.js";

// ---------------------------------------------------------------------------
// Pitch deck questions — content for the 10-section demo pitch, the 60-second
// elevator pitch and the Q&A rehearsal. One question group per slide, so the
// docx doubles as the slide-by-slide script a team turns into its own deck.
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

  // ── 6. Tiếp thị và bán hàng ───────────────────────────────────────────────

  pitch_op_marketing_4p: {
    id: "pitch_op_marketing_4p",
    text: "Kế hoạch tiếp thị và bán hàng của nhóm ra sao?",
    explanation:
      "Trả lời ngắn cho từng việc, nhất quán với khách hàng và mức giá ở các mục trước. Cần nêu:\n" +
      "- Sản phẩm, giá, kênh phân phối, truyền thông (4P)\n" +
      "- Cách bán hàng: ai bán, bán ở đâu, chốt đơn thế nào\n" +
      "- Mục tiêu số khách trong 3 tháng đầu\n" +
      "Không đạt: \"Quảng cáo Facebook và TikTok.\"\n" +
      "Đạt: \"Đăng trong hội nhóm của từng trường, tặng một lượt giữ bàn khi giới thiệu bạn. " +
      "Đặt và thanh toán trong ứng dụng. Mục tiêu 600 người dùng trong năm đầu.\"",
    suggested_actions: ["Giá ở đây khớp với dòng doanh thu đã nêu."],
  },

  // ── 7. Tài chính ──────────────────────────────────────────────────────────

  pitch_finance_summary: {
    id: "pitch_finance_summary",
    text: "Tình hình tài chính của dự án tóm lại thế nào?",
    explanation:
      "Chỉ nêu kết luận, số chi tiết nằm trong file Excel P&L. Cần nêu:\n" +
      "- Doanh thu, chi phí, lợi nhuận theo kỳ\n" +
      "- Khi nào hòa vốn\n" +
      "- Khoản lỗ lũy kế lớn nhất và vì sao chịu được\n" +
      "Không đạt: \"Dự án có lãi sau một thời gian.\"\n" +
      "Đạt: \"Doanh thu năm một 138 triệu, chi phí 180 triệu, lỗ 42 triệu. Lợi nhuận dương từ tháng 13, hòa vốn lũy kế ở tháng 26, " +
      "lỗ lũy kế lớn nhất 42 triệu, trang trải bằng vốn góp 50 triệu của nhóm.\"",
    suggested_actions: ["Các con số khớp với file Excel P&L."],
  },

  // ── 8. Đội ngũ ────────────────────────────────────────────────────────────

  pitch_team_profile: {
    id: "pitch_team_profile",
    text: "Từng thành viên phụ trách việc gì và có năng lực gì để làm việc đó?",
    explanation:
      "Mỗi thành viên một dòng, chứng minh người đó hợp với vai trò. Cần nêu:\n" +
      "- Vai trò và ngành học\n" +
      "- Kinh nghiệm hoặc thành tích liên quan\n" +
      "- Vì sao người đó phù hợp, không chỉ ghi chức danh\n" +
      "Không đạt: \"An: CEO. Bình: CTO.\"\n" +
      "Đạt: \"An, CEO, ngành Quản trị kinh doanh, từng quản lý câu lạc bộ 40 người. " +
      "Bình, CTO, ngành Kỹ thuật phần mềm, đã làm 2 ứng dụng đang có người dùng.\"",
    suggested_actions: ["Các ngành học của nhóm bổ sung cho nhau, ít nhất hai ngành khác nhau."],
  },

  pitch_team_gap: {
    id: "pitch_team_gap",
    text: "Nhóm còn thiếu năng lực gì và định bổ sung bằng cách nào?",
    explanation:
      "Nêu thẳng điểm thiếu, nhà đầu tư tin đội ngũ biết điểm yếu của mình. Cần nêu:\n" +
      "- Điểm thiếu của đội ngũ hiện tại\n" +
      "- Cách bù: tuyển thêm, nhờ cố vấn, hợp tác hay học thêm\n" +
      "- Thời điểm thực hiện\n" +
      "Không đạt: \"Nhóm không thiếu gì.\"\n" +
      "Đạt: \"Chưa có người làm bán hàng với quán. Nhờ một giảng viên cố vấn kết nối quán trong tháng này và tuyển một bạn phụ trách đối tác vào quý sau.\"",
    suggested_actions: ["Mỗi điểm thiếu có một hành động bù cụ thể và thời điểm."],
  },

  // ── 9. Kết quả đạt được và nguồn vốn ──────────────────────────────────────

  pitch_pmf_customer_validation: {
    id: "pitch_pmf_customer_validation",
    text: "Khách hàng đã phản ứng thế nào với sản phẩm?",
    explanation:
      "Nêu hành động thật của khách, không chỉ lời khen. Cần nêu:\n" +
      "- Số người dùng thử và phản hồi\n" +
      "- Tỷ lệ quay lại, số người cam kết hoặc đã trả tiền\n" +
      "- Bằng chứng nào cho thấy khách chịu trả tiền\n" +
      "Không đạt: \"Mọi người đều khen hay.\"\n" +
      "Đạt: \"40 sinh viên dùng thử trong 2 tuần, 22 người quay lại lần hai, 9 người đã mua gói thành viên thử nghiệm.\"",
    suggested_actions: ["Tách rõ lời khen với hành động thật của khách."],
  },

  pitch_pmf_mvp_demo: {
    id: "pitch_pmf_mvp_demo",
    text: "Nhóm trình bày bản thử (MVP) trong buổi pitch thế nào?",
    explanation:
      "Bản thử chỉ nên chiếm 30 đến 45 giây trong 10 phút. Gợi ý dùng clip 15 đến 20 giây, bỏ qua bước đăng nhập. Cần nêu:\n" +
      "- Clip cho thấy tính năng cốt lõi nào\n" +
      "- Clip chứng minh điều gì\n" +
      "- Phương án dự phòng nếu mạng hoặc sản phẩm lỗi\n" +
      "Không đạt: \"Demo toàn bộ ứng dụng.\"\n" +
      "Đạt: \"Clip 18 giây: chọn quán, thấy bàn trống, giữ bàn thành công. Chứng minh việc giữ bàn mất dưới 20 giây. Có sẵn clip tải về máy nếu mạng lỗi.\"",
    suggested_actions: ["Có clip dự phòng chạy được khi không có mạng."],
  },

  pitch_capital_plan: {
    id: "pitch_capital_plan",
    text: "Dự án lấy vốn từ đâu, cần bao nhiêu và dùng vào việc gì?",
    explanation:
      "Mọi nhóm đều trả lời, kể cả nhóm không gọi vốn bên ngoài. Cần nêu:\n" +
      "- Nguồn vốn: vốn tự có, tái đầu tư từ doanh thu, vốn góp của nhóm hoặc nhà đầu tư\n" +
      "- Số tiền và vì sao đúng số đó\n" +
      "- Dùng vào việc gì, chia theo tỷ lệ\n" +
      "Không đạt: \"Cần 500 triệu để phát triển.\"\n" +
      "Đạt: \"Nhóm góp 50 triệu tiền mặt, không gọi vốn ngoài. Số này đủ trang trải mức lỗ lũy kế lớn nhất là 42 triệu cộng 8 triệu dự phòng. " +
      "Dùng 50% sản phẩm, 30% tiếp thị, 20% vận hành.\"",
    suggested_actions: ["Số vốn đủ chống đỡ khoản lỗ lũy kế lớn nhất ở mục Tài chính."],
  },

  // ── 10. Kêu gọi hành động ─────────────────────────────────────────────────

  pitch_ask: {
    id: "pitch_ask",
    text: "Nhóm kêu gọi hội đồng và nhà đầu tư làm điều gì?",
    explanation:
      "Slide cuối chỉ nên có một việc người nghe làm được ngay. Cần nêu:\n" +
      "- Một yêu cầu cụ thể: vốn, kết nối khách hàng, cố vấn hoặc nguồn lực\n" +
      "- Con số hoặc mốc thời gian nếu có\n" +
      "- Vì sao yêu cầu này giúp dự án đi tiếp\n" +
      "Không đạt: \"Mong mọi người ủng hộ.\"\n" +
      "Đạt: \"Nhóm cần giới thiệu thêm 5 quán đối tác ở khu đại học khác trong 2 tháng tới, để thử mô hình ngoài Thủ Đức.\"",
    suggested_actions: ["Lời kêu gọi chỉ có một việc."],
  },

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
