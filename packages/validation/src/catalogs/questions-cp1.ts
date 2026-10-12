import type { Question } from "./types.js";

// ---------------------------------------------------------------------------
// CP1 questions — Startup Checkpoint 1 (idea validation).
// Same wording convention as questions.ts: purpose line → what to cover → example.
// ---------------------------------------------------------------------------

export const CP1_QUESTIONS = {
  cp1_team_name: {
    id: "cp1_team_name",
    text: "Tên nhóm của bạn là gì?",
    explanation:
      "Ghi đúng tên nhóm như trong danh sách đăng ký môn học (kèm mã nhóm nếu có).",
    suggested_actions: ["Đối chiếu với danh sách nhóm của lớp trước khi lưu."],
  },

  cp1_team_members: {
    id: "cp1_team_members",
    text: "Nhóm gồm những thành viên nào và mỗi người phụ trách công việc gì?",
    explanation:
      "Mỗi thành viên một dòng, theo dạng: Họ tên, vai trò, công việc phụ trách cụ thể.\n" +
      "Ví dụ: \"Nguyễn Văn A, Trưởng nhóm, phụ trách nghiên cứu khách hàng và phỏng vấn người dùng.\"",
    suggested_actions: [
      "Không bỏ sót thành viên nào.",
      "Công việc phải là hành động cụ thể (nghiên cứu, phỏng vấn, thiết kế...), không chỉ ghi \"thành viên\".",
    ],
  },

  cp1_idea_name: {
    id: "cp1_idea_name",
    text: "Tên ý tưởng / sản phẩm của nhóm là gì?",
    explanation:
      "Tên phải cho người đọc biết sản phẩm làm gì, cho ai. Không dùng slogan chung chung.\n" +
      "Không đạt: \"Nền tảng kết nối thông minh.\"\n" +
      "Đạt: \"Ứng dụng đặt chỗ học nhóm theo giờ tại quán cà phê gần trường đại học.\"",
    suggested_actions: [
      "Đưa tên cho người chưa biết dự án đọc: họ có đoán được sản phẩm làm gì không?",
    ],
  },

  cp1_primary_customer: {
    id: "cp1_primary_customer",
    text: "Khách hàng chính của nhóm là ai?",
    explanation:
      "Chọn MỘT nhóm khách hàng đủ hẹp để nhóm tìm được người thật trong vòng một tuần. Cần nêu đủ 6 ý:\n" +
      "- Họ là ai\n" +
      "- Độ tuổi\n" +
      "- Bối cảnh họ hoạt động\n" +
      "- Hành vi cụ thể liên quan đến vấn đề\n" +
      "- Khả năng chi trả\n" +
      "- Lý do nhóm chọn nhóm người này trước tiên\n" +
      "Không đạt: \"Sinh viên\", \"Người đi làm\", \"Doanh nghiệp vừa và nhỏ\".\n" +
      "Đạt: \"Sinh viên đại học năm 2 đến năm 3 tại TP.HCM, thường học nhóm 3 đến 6 người sau giờ học " +
      "ít nhất hai lần mỗi tuần để làm bài tập nhóm, có thể chi khoảng 30 đến 50 nghìn mỗi buổi.\"",
    suggested_actions: [
      "Tự kiểm tra: bạn kể được nơi hoặc nhóm cụ thể để tìm 10 người như vậy trong một tuần không?",
      "Không để một nhãn chung (\"sinh viên\", \"người đi làm\") đứng một mình.",
    ],
  },

  cp1_non_priority_customer: {
    id: "cp1_non_priority_customer",
    text: "Ai không phải là khách hàng ưu tiên trong giai đoạn đầu?",
    explanation:
      "Nêu nhóm người nhóm cố tình chưa phục vụ và lý do cụ thể. " +
      "Mục này giúp nhóm biết mình đang bỏ ai ra ngoài và vì sao quyết định đó hợp lý lúc này, " +
      "không phải danh sách những người nhóm không thích.\n" +
      "Ví dụ: \"Chưa phục vụ sinh viên năm nhất, vì họ chưa có nhiều bài tập nhóm nên ít gặp vấn đề này.\"",
    suggested_actions: [
      "Mỗi nhóm bị loại phải kèm một lý do, không để trống lý do.",
    ],
  },

  cp1_role_breakdown: {
    id: "cp1_role_breakdown",
    text: "Các bên tham gia (User, Customer, Payer, Partner) là ai?",
    explanation:
      "Bốn vai cần xác định:\n" +
      "- User: người dùng sản phẩm\n" +
      "- Customer: người ra quyết định dùng sản phẩm\n" +
      "- Payer: người trả tiền\n" +
      "- Partner: đối tác cung cấp nguồn lực\n" +
      "Nếu chỉ có một bên duy nhất, ghi: \"Chỉ có một bên duy nhất.\"\n" +
      "Nếu có nhiều bên, mỗi vai viết một đoạn riêng theo mẫu: \"[Tên vai] là [họ là ai]. " +
      "Pain riêng của họ là [vấn đề họ gặp]. Lợi ích khi tham gia là [điều họ được]. " +
      "Lý do họ sẽ tham gia là [động lực cụ thể].\"\n" +
      "Nếu một bên giữ nhiều vai (ví dụ vừa là User vừa là Payer), ghi rõ điều đó.",
    suggested_actions: [
      "Không gộp lợi ích của nhiều bên thành một mô tả chung.",
      "Nếu Payer khác User, giải thích vì sao Payer có động lực trả tiền.",
    ],
  },

  cp1_customer_story: {
    id: "cp1_customer_story",
    text: "Câu chuyện về một khách hàng tiêu biểu cụ thể là gì?",
    explanation:
      "Kể về MỘT người dùng tiêu biểu: có tên, tuổi, bối cảnh, mục tiêu và rào cản. " +
      "Nên dựa trên một người thật nhóm đã trò chuyện hoặc quan sát. Câu chuyện phải đủ cụ thể để người đọc hình dung ra người thật.\n" +
      "Không đạt: \"Người dùng là sinh viên gặp khó khăn khi học nhóm.\"\n" +
      "Đạt: \"Minh, 20 tuổi, sinh viên năm 2 tại TP.HCM. Minh thường học nhóm 4 người vào tối thứ Ba và thứ Năm. " +
      "Mỗi lần tìm chỗ, Minh phải nhắn tin hỏi mấy bạn, đi thử 2 đến 3 quán rồi mới biết còn bàn lớn và có ổ điện không. " +
      "Hôm deadline môn Marketing, cả nhóm mất gần một tiếng tìm chỗ trước khi ngồi được.\"",
    suggested_actions: [
      "Kiểm tra đủ 5 yếu tố: tên, tuổi, bối cảnh, mục tiêu, rào cản.",
    ],
  },

  cp1_main_problem: {
    id: "cp1_main_problem",
    text: "Vấn đề chính của khách hàng là gì?",
    explanation:
      "Viết vấn đề từ góc nhìn khách hàng đang gặp phải, không phải nhận xét của nhóm. Cần nêu:\n" +
      "- Vấn đề xảy ra trong tình huống nào\n" +
      "- Xảy ra thường xuyên đến mức nào\n" +
      "- Hậu quả cụ thể, tính bằng thời gian, tiền bạc, rủi ro hoặc cơ hội bị mất\n" +
      "Không đạt: \"Sinh viên mất thời gian tìm chỗ học nhóm.\"\n" +
      "Đạt: \"Sinh viên năm 2 đến năm 3 phải mất 30 đến 60 phút để tìm chỗ học nhóm mỗi khi gần deadline. " +
      "Nếu không tìm được chỗ phù hợp, cả nhóm phải ngồi tạm hoặc đổi địa điểm nhiều lần, khiến buổi học bị trễ và mọi người mất tập trung.\"",
    suggested_actions: [
      "Có ít nhất một con số hoặc mức độ đo được (phút, tiền, số lần).",
    ],
  },

  cp1_problem_severity: {
    id: "cp1_problem_severity",
    text: "Vì sao vấn đề này đủ đau để khách hàng chủ động tìm giải pháp?",
    explanation:
      "\"Đủ đau\" nghĩa là khách hàng sẵn sàng bỏ công, bỏ tiền hoặc đổi thói quen để giải quyết. Trả lời thẳng:\n" +
      "- Đây là vấn đề thật hay chỉ là \"hơi bất tiện\"?\n" +
      "- Điều gì xảy ra nếu không giải quyết?\n" +
      "- Vấn đề lặp lại đủ thường xuyên để khách hàng chịu thay đổi hành vi không?\n" +
      "Dấu hiệu tốt: khách hàng đã tự tìm cách xử lý (hỏi bạn, thử nhiều quán, trả tiền cho giải pháp tạm).",
    suggested_actions: [
      "Nêu ít nhất một việc khách hàng đã làm để tự giải quyết, nếu có.",
    ],
  },

  cp1_current_alternatives: {
    id: "cp1_current_alternatives",
    text: "Hiện tại khách hàng đang dùng cách nào để giải quyết vấn đề?",
    explanation:
      "Không có cách hiện tại thì không đánh giá được sản phẩm của nhóm có tốt hơn hay không, nên mục này rất quan trọng.\n" +
      "Liệt kê mọi cách khách hàng đang tự xử lý, kể cả \"không làm gì\" hoặc \"chấp nhận sống chung với vấn đề\". " +
      "Mỗi cách viết thành một câu mô tả họ làm gì cụ thể.\n" +
      "Ví dụ: \"Nhắn tin hỏi từng bạn trong nhóm quán nào còn chỗ.\"; \"Đi thử 2 đến 3 quán rồi mới chọn.\"; \"Không đặt trước, đến thư viện ngồi tạm.\"",
    suggested_actions: [
      "Mỗi cách là một câu riêng, bắt đầu bằng hành động của khách hàng.",
    ],
  },

  cp1_alternatives_analysis: {
    id: "cp1_alternatives_analysis",
    text: "Phân tích từng cách khách hàng đang dùng hiện tại",
    explanation:
      "Với mỗi cách ở câu trước, viết một đoạn phân tích theo bốn chiều:\n" +
      "- Tốn tiền không, bao nhiêu\n" +
      "- Tốn thời gian không, ở bước nào\n" +
      "- Bất tiện cụ thể ở đâu trong quy trình\n" +
      "- Vì sao khách hàng vẫn tiếp tục dùng dù biết nó bất tiện (chiều quan trọng nhất)",
    suggested_actions: [
      "Mỗi cách trả lời đủ 4 chiều, không bỏ chiều \"vì sao vẫn dùng\".",
    ],
  },

  cp1_required_improvement: {
    id: "cp1_required_improvement",
    text: "Sản phẩm phải tốt hơn ở điểm nào cụ thể để khách hàng chịu đổi hành vi?",
    explanation:
      "Nêu khác biệt rõ ràng, đo được so với cách khách hàng đang làm. " +
      "Không viết chung chung kiểu \"tiện hơn\" hay \"nhanh hơn\". Phải nói nhanh hơn bao nhiêu, tiện ở bước cụ thể nào.\n" +
      "Ví dụ: \"Rút thời gian tìm chỗ từ 30 đến 60 phút xuống dưới 5 phút bằng cách xem bàn trống và ổ điện của các quán gần trường trên một màn hình.\"",
    suggested_actions: [
      "Có con số hoặc tên bước cụ thể, không dùng \"tiện hơn / nhanh hơn\" đứng một mình.",
    ],
  },

  cp1_solution_description: {
    id: "cp1_solution_description",
    text: "Sản phẩm làm gì, cho ai, trong tình huống nào?",
    explanation:
      "Mô tả sản phẩm theo ba chiều: làm gì cụ thể, cho ai cụ thể, trong tình huống nào cụ thể.\n" +
      "Tránh các cụm từ mơ hồ: \"nền tảng thông minh\", \"tối ưu trải nghiệm\", \"AI tự động\", \"all-in-one\", \"kết nối\". " +
      "Nếu buộc phải dùng, định nghĩa ngay bên dưới: từ này nghĩa là gì cụ thể, ai đánh giá được, đo bằng tiêu chí nào.",
    suggested_actions: [
      "Rà lại câu trả lời, tìm và thay các từ mơ hồ ở danh sách trên.",
    ],
  },

  cp1_solution_mechanism: {
    id: "cp1_solution_mechanism",
    text: "Cơ chế tác động: sản phẩm giảm pain bằng cách nào?",
    explanation:
      "Mô tả theo luồng bốn bước:\n" +
      "- Input: người dùng cung cấp gì cho sản phẩm?\n" +
      "- Xử lý: sản phẩm làm gì với input đó, theo cơ chế nào?\n" +
      "- Output: người dùng nhận được gì cụ thể?\n" +
      "- Hành động: output đó giúp người dùng làm gì tốt hơn so với trước?\n" +
      "Ví dụ: Input là giờ học, số người, khu vực. Xử lý là lọc các quán còn bàn phù hợp. " +
      "Output là danh sách 3 quán kèm bàn trống và ổ điện. Hành động là giữ bàn trong vài phút thay vì nhắn hỏi từng quán.",
    suggested_actions: [
      "Đủ 4 bước theo đúng thứ tự, không chỉ liệt kê tính năng.",
    ],
  },

  cp1_core_features: {
    id: "cp1_core_features",
    text: "Tính năng lõi của bản đầu tiên là gì?",
    explanation:
      "Mỗi tính năng một dòng, theo dạng: [Tên tính năng]: giải quyết [pain cụ thể] (Có / Không có trong bản đầu).\n" +
      "Ví dụ: \"Xem bàn trống theo giờ: giải quyết việc phải nhắn hỏi từng quán (Có trong bản đầu).\"",
    suggested_actions: [
      "Mỗi tính năng phải gắn với một pain đã nêu ở phần Pain Point.",
    ],
  },

  cp1_out_of_scope: {
    id: "cp1_out_of_scope",
    text: "Những gì nhóm chủ động không làm ở giai đoạn đầu?",
    explanation:
      "Nêu từng tính năng hoặc nhóm người dùng nhóm chủ động chưa làm / chưa phục vụ ở giai đoạn đầu, kèm lý do.\n" +
      "Ví dụ: \"Chưa làm thanh toán online: giai đoạn đầu giữ chỗ miễn phí để tập trung kiểm chứng nhu cầu.\"",
    suggested_actions: [
      "Mỗi mục kèm một lý do, không chỉ liệt kê tên.",
    ],
  },

  cp1_riskiest_assumption: {
    id: "cp1_riskiest_assumption",
    text: "Giả định nguy hiểm nhất cần test trước là gì?",
    explanation:
      "Giả định nguy hiểm nhất là điều nhóm đang tin là đúng nhưng chưa kiểm chứng, và nếu sai thì toàn bộ ý tưởng không còn hoạt động. " +
      "Chỉ chọn MỘT giả định quan trọng nhất, không liệt kê nhiều.\n" +
      "Ví dụ: \"Sinh viên chịu trả 30 đến 50 nghìn mỗi buổi để được giữ chỗ trước.\"",
    suggested_actions: [
      "Thử đảo ngược: nếu giả định này sai, ý tưởng còn lý do tồn tại không? Nếu còn, hãy chọn giả định khác.",
    ],
  },

  cp1_mvp_definition: {
    id: "cp1_mvp_definition",
    text: "MVP của nhóm là gì?",
    explanation:
      "MVP là cách test nhỏ nhất để kiểm chứng giả định nguy hiểm nhất ở câu trước, không phải một app nhỏ hơn.\n" +
      "Có thể là Google Form, landing page, nhóm Zalo, Notion, hoặc concierge MVP (nhóm tự làm thủ công phía sau, khách hàng vẫn thấy như đang dùng sản phẩm).\n" +
      "Cần giải thích vì sao cách này đủ để kiểm chứng giả định đó.\n" +
      "Ví dụ: \"Tạo Google Form để sinh viên chọn giờ và khu vực; nhóm tự gọi quán xác nhận bàn rồi nhắn lại qua Zalo.\"",
    suggested_actions: [
      "Làm được trong vài ngày bằng công cụ có sẵn, không cần lập trình.",
    ],
  },

  cp1_mvp_test_plan: {
    id: "cp1_mvp_test_plan",
    text: "Test MVP với ai, ở đâu, khi nào?",
    explanation:
      "Cụ thể đến mức có thể bắt tay làm ngay. Nêu đủ: số lượng người, họ là ai, tìm họ qua kênh nào, và khoảng thời gian test.\n" +
      "Ví dụ: \"10 đến 15 sinh viên năm 2 đến năm 3 tại Đại học Kinh tế TP.HCM, tìm qua nhóm Facebook lớp học, test trong tuần từ ngày 14 đến ngày 20 tháng này.\"",
    suggested_actions: [
      "Đủ 4 ý: số lượng, đối tượng, kênh, ngày bắt đầu và kết thúc.",
    ],
  },

  cp1_mvp_pass_fail: {
    id: "cp1_mvp_pass_fail",
    text: "Tiêu chí pass và fail của MVP là gì?",
    explanation:
      "Viết thành ba đoạn riêng:\n" +
      "- Pass: kết quả nào, đo được, chứng minh giả định đúng?\n" +
      "- Fail: kết quả nào chứng minh giả định sai?\n" +
      "- Nếu fail: nhóm sẽ điều chỉnh theo hướng nào?\n" +
      "Ví dụ Pass: \"Ít nhất 8 trong 15 người đặt chỗ qua form trong tuần test.\" " +
      "Fail: \"Dưới 4 người đặt chỗ.\" Nếu fail: \"Phỏng vấn lại để tìm lý do, đổi nhóm khách hàng hoặc đổi cách thu tiền.\"",
    suggested_actions: [
      "Pass và Fail đều có con số cụ thể, được quyết định trước khi test.",
    ],
  },

  cp1_evidence_assumptions: {
    id: "cp1_evidence_assumptions",
    text: "Đâu là dữ liệu thực tế (bằng chứng), đâu là giả định chưa kiểm chứng?",
    explanation:
      "Viết thành hai phần riêng.\n" +
      "Phần 1: Những điều nhóm biết từ dữ liệu thực tế. Liệt kê từng điều kèm nguồn, theo loại: " +
      "phỏng vấn (bao nhiêu người, hỏi về gì), khảo sát (bao nhiêu phản hồi, từ nguồn nào), " +
      "quan sát (quan sát gì, ở đâu, khi nào), thử nghiệm đã làm, số liệu thứ cấp (nguồn, năm).\n" +
      "Phần 2: Những điều nhóm đang giả định và chưa kiểm chứng. Với mỗi giả định, nêu: " +
      "\"nếu giả định này sai thì điều gì xảy ra với ý tưởng?\" và \"cách test nhỏ nhất để kiểm chứng\".\n" +
      "Nếu chưa có bằng chứng nào, ghi thẳng: \"Chưa có bằng chứng. Toàn bộ nội dung trong tài liệu hiện là giả định cần kiểm chứng.\"",
    suggested_actions: [
      "Mỗi bằng chứng có nguồn và con số (bao nhiêu người, khi nào).",
      "Không để trống: nếu chưa có gì thì ghi rõ \"Chưa có bằng chứng\".",
    ],
  },

  cp1_revenue_model: {
    id: "cp1_revenue_model",
    text: "Mô hình doanh thu dự kiến là gì?",
    explanation:
      "Ở bước mô tả ý tưởng này, nhóm chưa cần chứng minh doanh thu thật, nhưng phải xác định ai có thể trả tiền và vì lý do gì. " +
      "Viết một đoạn trả lời bốn câu hỏi:\n" +
      "- Ai là người trả tiền?\n" +
      "- Họ trả vì nhận được giá trị cụ thể nào?\n" +
      "- Thu tiền theo hình thức nào (một lần, định kỳ, theo lượt dùng, hoa hồng)?\n" +
      "- Những điều trên là dữ liệu thực tế hay giả định?\n" +
      "Nếu người trả tiền không phải người dùng, giải thích vì sao họ có động lực trả.",
    suggested_actions: [
      "Trả lời đủ 4 câu hỏi, đánh dấu rõ điều nào là giả định.",
    ],
  },
} satisfies Record<string, Question>;
