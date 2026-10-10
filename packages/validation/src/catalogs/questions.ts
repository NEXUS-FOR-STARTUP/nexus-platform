import type { Question } from "./types.js";

// ---------------------------------------------------------------------------
// Canonical question registry (plan section 5). One entry per stable question
// id. Every template references ids from this map; `validateCatalog` fails if a
// template references an id that is not here. Ids are stable strings, never
// reused or renumbered.
//
// Wording convention: `explanation` renders with line breaks preserved. Order:
// purpose line → what to cover (bullets) → "Không đạt" / "Đạt" example. Keep
// `suggested_actions` as short self-check items that do NOT repeat the
// explanation.
// ---------------------------------------------------------------------------

export const QUESTION_REGISTRY = {
  // ── CP1 — Startup Checkpoint 1 (idea validation) ─────────────────────────

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

  // ── CP2 — Startup Checkpoint 2 (market research + debate) ─────────────────

  cp2_problem_need: {
    id: "cp2_problem_need",
    text: "Vấn đề / nhu cầu khách hàng mà nhóm giải quyết là gì?",
    explanation:
      "Đây là nền của cơ hội kinh doanh (Cơ hội = Vấn đề/Nhu cầu + Giải pháp). Cần nêu:\n" +
      "- Ai đang gặp vấn đề, trong tình huống nào\n" +
      "- Vấn đề gây hậu quả gì cho họ\n" +
      "- Vì sao các cách hiện tại chưa giải quyết được\n" +
      "Tránh viết quá chung (ví dụ \"sinh viên cần học tốt hơn\"); nói rõ họ đang kẹt ở bước nào.",
    suggested_actions: [
      "Có ít nhất một tình huống cụ thể và một hậu quả đo được.",
    ],
  },

  cp2_solution: {
    id: "cp2_solution",
    text: "Giải pháp của nhóm là gì?",
    explanation:
      "Mô tả giải pháp giải quyết đúng vấn đề đã nêu ở câu trước. Cần nêu:\n" +
      "- Sản phẩm / dịch vụ làm gì, cho ai\n" +
      "- Khác gì so với cách khách hàng đang dùng\n" +
      "- Nhóm KHÔNG làm gì (giới hạn của giải pháp)",
    suggested_actions: [
      "Mỗi ý trong giải pháp phải trả lời được: nó giải quyết phần nào của vấn đề?",
    ],
  },

  cp2_opportunity: {
    id: "cp2_opportunity",
    text: "Cơ hội của nhóm là gì?",
    explanation:
      "Cơ hội = Vấn đề/Nhu cầu + Giải pháp. Viết 1 đến 2 đoạn kết hợp hai phần trên, " +
      "giải thích vì sao vấn đề này đủ lớn và giải pháp của nhóm phù hợp để nắm bắt nó.",
    suggested_actions: [
      "Đọc lại: người chưa biết dự án có hiểu vì sao đây là cơ hội không?",
    ],
  },

  cp2_vpc_customer_profile: {
    id: "cp2_vpc_customer_profile",
    text: "Value Proposition Canvas (Hồ sơ khách hàng): khách hàng cần làm gì, gặp nỗi đau gì, mong muốn gì?",
    explanation:
      "Trước hết xác định khách hàng mục tiêu và người trực tiếp làm việc với nhóm (nếu khác người ra quyết định, nêu cả hai). Sau đó viết ba phần:\n" +
      "- Customer Jobs (công việc cần hoàn thành): khách hàng đang cố đạt điều gì, trong hoàn cảnh nào\n" +
      "- Customer Pains (nỗi đau): trở ngại, rủi ro, áp lực khi họ làm việc đó\n" +
      "- Customer Gains (lợi ích mong muốn): kết quả họ muốn có\n" +
      "Dựa vào dữ liệu phỏng vấn và khảo sát của nhóm, không suy đoán.",
    suggested_actions: [
      "Mỗi phần viết thành đoạn có lý do, không chỉ gạch đầu dòng ngắn.",
    ],
  },

  cp2_vpc_value_map: {
    id: "cp2_vpc_value_map",
    text: "Value Proposition Canvas (Giá trị sản phẩm): sản phẩm giảm đau và tạo lợi ích như thế nào?",
    explanation:
      "Viết ba phần, đối chiếu với hồ sơ khách hàng ở câu trước:\n" +
      "- Products & Services: các sản phẩm / dịch vụ / gói nhóm cung cấp\n" +
      "- Pain Relievers (giảm đau): sản phẩm xử lý từng Customer Pain như thế nào\n" +
      "- Gain Creators (tạo lợi ích): sản phẩm đem lại từng Customer Gain như thế nào\n" +
      "Nếu có Pain chưa giải quyết được, ghi rõ.",
    suggested_actions: [
      "Mỗi Pain Reliever chỉ rõ nó giải quyết Pain nào; mỗi Gain Creator chỉ rõ Gain nào.",
    ],
  },

  cp2_research_objectives: {
    id: "cp2_research_objectives",
    text: "Mục tiêu nghiên cứu (câu hỏi nghiên cứu cụ thể) là gì?",
    explanation:
      "Viết mục tiêu nghiên cứu thành các câu hỏi cụ thể (thường khoảng 3 đến 5 câu), nhằm kiểm chứng:\n" +
      "- Vấn đề có thật sự tồn tại không\n" +
      "- Khách hàng đang tự xử lý bằng cách nào, vì sao chưa đủ\n" +
      "- Phần nào của giải pháp được đánh giá cao nhất\n" +
      "- Yếu tố nào ảnh hưởng đến quyết định dùng hoặc trả phí\n" +
      "Mỗi câu hỏi phải trả lời được bằng dữ liệu nhóm sẽ thu thập.",
    suggested_actions: [
      "Mỗi câu hỏi nghiên cứu gắn được với ít nhất một nguồn dữ liệu (phỏng vấn, khảo sát).",
    ],
  },

  cp2_customer_discovery_process: {
    id: "cp2_customer_discovery_process",
    text: "Quá trình Khám phá khách hàng (Customer Discovery) diễn ra như thế nào?",
    explanation:
      "Mô tả nhóm đã làm gì, theo trình tự nào, thu được gì. Cần nêu:\n" +
      "- Phương pháp (ví dụ phỏng vấn sâu), số người, nhóm đối tượng, thời lượng mỗi cuộc\n" +
      "- Nội dung chính đã hỏi\n" +
      "- Cách tổng hợp dữ liệu (ví dụ gom câu trả lời theo chủ đề lặp lại)\n" +
      "- Giới hạn của mẫu (không đại diện cho toàn thị trường nếu chỉ khảo sát một nhóm hẹp)\n" +
      "Kết quả nên trình bày theo bảng gồm các cột Chủ đề, Bằng chứng, Quan sát, Insight, " +
      "rồi rút ra các pain point chính và một đoạn customer insight tổng kết.",
    suggested_actions: [
      "Mỗi insight có bằng chứng kèm con số (ví dụ \"15/25 người nhắc đến...\").",
    ],
  },

  cp2_expert_interviews: {
    id: "cp2_expert_interviews",
    text: "Nhóm đã phỏng vấn chuyên gia nào và học được gì?",
    explanation:
      "BẮT BUỘC: thiếu mục này bài sẽ bị trượt. Phải phỏng vấn ít nhất 2 chuyên gia, mỗi người có từ 6 tháng kinh nghiệm trở lên.\n" +
      "Với mỗi chuyên gia, nêu:\n" +
      "- Hồ sơ: họ tên, chức danh / đơn vị, số năm kinh nghiệm, thông tin liên hệ\n" +
      "- Learning points (điều học được):\n" +
      "  + Market view: góc nhìn của chuyên gia về thị trường\n" +
      "  + Beware-of: điều chuyên gia cảnh báo cần tránh\n" +
      "  + Experience with target customers: kinh nghiệm của chuyên gia với nhóm khách hàng mục tiêu\n" +
      "  + Các điểm khác đáng chú ý",
    suggested_actions: [
      "Có đủ ≥2 chuyên gia, mỗi người ghi rõ số năm kinh nghiệm.",
      "Hồ sơ và liên hệ đầy đủ để người chấm có thể kiểm tra.",
    ],
  },

  cp2_survey: {
    id: "cp2_survey",
    text: "Nhóm đã thực hiện khảo sát (survey) như thế nào và kết quả ra sao?",
    explanation:
      "BẮT BUỘC: thiếu mục này bài sẽ bị trượt. Khảo sát phải có ít nhất 100 người trả lời. Cần nêu đủ:\n" +
      "- Mục tiêu và đối tượng khảo sát\n" +
      "- Phương pháp và công cụ sử dụng\n" +
      "- Bảng hỏi: ít nhất 7 câu và ít nhất 2 loại câu hỏi (ví dụ trắc nghiệm, thang đo mức độ, câu hỏi mở)\n" +
      "- Cách tuyển người trả lời và ưu đãi (incentives) nếu có\n" +
      "- Ẩn danh: form có phần thông tin nhân khẩu học (demographic) và email\n" +
      "- Lưu trữ dữ liệu và đồng thuận có hiểu biết (informed consent)\n" +
      "- Phương pháp chọn mẫu và tỷ lệ phản hồi\n" +
      "- Phân tích kết quả và kết luận",
    suggested_actions: [
      "Đếm lại: số người trả lời ≥100, số câu hỏi ≥7, có ≥2 loại câu hỏi.",
      "Mỗi gạch đầu dòng trong phần \"Cần nêu đủ\" đều có câu trả lời riêng.",
    ],
  },

  cp2_pain_point_interviews: {
    id: "cp2_pain_point_interviews",
    text: "[Không bắt buộc] Nhóm đã phỏng vấn pain point chưa?",
    explanation:
      "Không bắt buộc, nhưng giúp bài vững hơn. Nếu làm: phỏng vấn ít nhất 10 người cho mỗi nhóm liên quan (stakeholder, ví dụ người dùng, người trả tiền, đối tác), " +
      "rồi tổng hợp bằng 3 câu hỏi: Có nỗi đau thật không? Nỗi đau đó là gì? Có nhiều người gặp không?",
    suggested_actions: [
      "Nếu làm, mỗi nhóm stakeholder có kết quả riêng trước khi viết phần tổng hợp 3 câu.",
    ],
  },

  cp2_tam_sam_som: {
    id: "cp2_tam_sam_som",
    text: "Quy mô thị trường TAM / SAM / SOM của nhóm là bao nhiêu?",
    explanation:
      "Ước lượng ba tầng, mỗi tầng kèm cách tính và nguồn số liệu:\n" +
      "- TAM (tổng thị trường): toàn bộ khách hàng có thể có × giá dịch vụ\n" +
      "- SAM (thị trường có thể phục vụ): phần của TAM nhóm thực sự tiếp cận được ở giai đoạn đầu (theo khu vực, nhóm khách hàng, kênh)\n" +
      "- SOM (thị trường có thể chiếm): số khách hàng nhóm phục vụ được thực tế, tính từ năng lực vận hành\n" +
      "Nên tính SOM theo cách bottom-up: năng lực phục vụ mỗi kỳ × số kỳ mỗi năm × giá.\n" +
      "Không viết kiểu \"chỉ cần chiếm 1% thị trường\" mà không có căn cứ.",
    suggested_actions: [
      "Mỗi con số có nguồn trích dẫn hoặc công thức tính kèm theo.",
      "Chỉ rõ SOM nhỏ hơn SAM và lý do.",
    ],
  },

  cp2_porters_five_forces: {
    id: "cp2_porters_five_forces",
    text: "Phân tích Porter's Five Forces cho thị trường của nhóm",
    explanation:
      "Phân tích 5 lực lượng, mỗi lực 1 đến 2 câu kèm bằng chứng:\n" +
      "- Rivalry: mức cạnh tranh giữa các đối thủ hiện có\n" +
      "- New entrants: mức dễ dàng cho người mới tham gia\n" +
      "- Substitution: sản phẩm / cách làm thay thế\n" +
      "- Buyer power: quyền lực của người mua\n" +
      "- Supplier power: quyền lực của nhà cung cấp\n" +
      "Kết luận bằng vị trí phòng thủ của nhóm: nhóm bảo vệ lợi thế bằng cách nào.",
    suggested_actions: [
      "Có đủ 5 lực và một đoạn kết luận về vị trí phòng thủ.",
    ],
  },

  cp2_competitive_analysis: {
    id: "cp2_competitive_analysis",
    text: "Phân tích cạnh tranh (Competitive Analysis Framework) của nhóm",
    explanation:
      "Phân loại đối thủ theo bốn nhóm: Direct (cùng giải pháp), Indirect (giải quyết cùng vấn đề bằng cách khác), " +
      "Substitute (thay thế), New entrants (người mới có thể vào). Với mỗi nhóm, nêu ưu và nhược điểm, " +
      "và so sánh với nhóm mình.\n" +
      "Sau đó nêu:\n" +
      "- Actionables: nhóm sẽ làm gì khác đi vì phân tích này\n" +
      "- Commonalities: điểm chung rút ra từ các đối thủ (ví dụ cùng thiếu điều gì)",
    suggested_actions: [
      "Mỗi nhóm đối thủ có ít nhất một ví dụ cụ thể.",
      "Phần Actionables là hành động nhóm sẽ thực hiện, không chỉ nhận xét.",
    ],
  },

  cp2_invisible_competitors: {
    id: "cp2_invisible_competitors",
    text: "Đối thủ vô hình của nhóm là gì?",
    explanation:
      "Đối thủ vô hình là thói quen và rào cản tâm lý khiến khách hàng không chọn nhóm, ví dụ: trì hoãn, " +
      "tự xử lý trong nội bộ, \"không làm gì cả\", ưu tiên giải pháp miễn phí.\n" +
      "Với mỗi đối thủ vô hình, nêu cách nhóm thuyết phục khách đổi thói quen " +
      "(ví dụ bản dùng thử miễn phí, báo cáo mẫu).",
    suggested_actions: [
      "Mỗi đối thủ vô hình kèm một cách xử lý cụ thể.",
    ],
  },

  cp2_competitor_criteria_table: {
    id: "cp2_competitor_criteria_table",
    text: "[Không bắt buộc] Bảng tiêu chí so sánh đối thủ (Competitors' Criteria Table)",
    explanation:
      "Không bắt buộc, nhưng cần nếu muốn đạt điểm tối đa. Lập bảng so sánh theo các tiêu chí (metric), " +
      "khoảng 9 đối thủ cùng startup của nhóm.\n" +
      "Chọn tiêu chí khách hàng thật sự quan tâm (ví dụ giá, tốc độ, độ phù hợp với bối cảnh).",
    suggested_actions: [
      "Dùng cùng bộ tiêu chí cho mọi hàng, có hàng của nhóm để đối chiếu.",
    ],
  },

  cp2_mvp_demo: {
    id: "cp2_mvp_demo",
    text: "Demo MVP / Prototype của nhóm gồm những gì và chứng minh được điều gì?",
    explanation:
      "Trình bày bản demo hiện có. Cần nêu:\n" +
      "- Mục tiêu MVP: kiểm chứng giả định nào\n" +
      "- Cấu trúc MVP: các thành phần và công cụ đang dùng\n" +
      "- Quy trình demo theo từng bước (từ lúc khách hàng gửi yêu cầu đến lúc nhận kết quả)\n" +
      "- Minh chứng sẽ trình diễn (ảnh chụp, video, form, báo cáo mẫu, ví dụ trước và sau)\n" +
      "- MVP đã chứng minh được gì (và chưa chứng minh được gì)",
    suggested_actions: [
      "Mỗi minh chứng liệt kê là thứ có thể mở ra cho người chấm xem.",
    ],
  },

  cp2_iteration_refinement: {
    id: "cp2_iteration_refinement",
    text: "Nhóm đã lặp và tinh chỉnh (Iterating & Refining) từ phản hồi khách hàng như thế nào?",
    explanation:
      "Mô tả từng lần tinh chỉnh theo dạng: Trước đây nhóm nghĩ gì → khách hàng phản hồi gì → nhóm đã thay đổi gì. " +
      "Nêu rõ giả định nào hóa ra sai và tính năng nào được thêm, bớt hoặc sửa.\n" +
      "Ví dụ: \"Ban đầu nhóm định làm web app tự động; phản hồi cho thấy khách hàng cần người giải thích nên nhóm chuyển sang dịch vụ có người theo sát.\"",
    suggested_actions: [
      "Mỗi thay đổi gắn với một phản hồi cụ thể của khách hàng.",
    ],
  },

  cp2_surprises_pivot: {
    id: "cp2_surprises_pivot",
    text: "Nhóm gặp bất ngờ gì và có pivot không?",
    explanation:
      "Nêu những điều ngoài dự đoán khi làm việc với khách hàng, và pivot (thay đổi hướng) nếu có: " +
      "đổi tính năng, đổi từ B2C sang B2B, đổi kênh / phân phối.\n" +
      "Nếu nhóm không pivot, ghi rõ \"không pivot\" và vì sao hướng hiện tại vẫn phù hợp.",
    suggested_actions: [
      "Có ít nhất một bất ngờ kèm bằng chứng, hoặc lý do rõ ràng nếu không có.",
    ],
  },

  cp2_pmf_signals: {
    id: "cp2_pmf_signals",
    text: "Dấu hiệu Product-Market Fit ban đầu của nhóm là gì?",
    explanation:
      "Product-Market Fit (PMF) là mức sản phẩm đáp ứng đúng nhu cầu của thị trường. Nêu dấu hiệu ban đầu kèm số liệu cụ thể:\n" +
      "- Sự hài lòng của khách hàng (trích lời hoặc điểm đánh giá)\n" +
      "- Tín hiệu nhu cầu (số người đăng ký, sẵn sàng giới thiệu, sẵn sàng trả phí)\n" +
      "- Retention: tỷ lệ khách hàng quay lại dùng tiếp\n" +
      "Nêu rõ cỡ mẫu. Nếu mẫu nhỏ, gọi đó là tín hiệu ban đầu, không khẳng định đã đạt PMF.",
    suggested_actions: [
      "Mỗi dấu hiệu có con số kèm cỡ mẫu (ví dụ \"7/9 nhóm...\").",
    ],
  },

  cp2_marketing_4p: {
    id: "cp2_marketing_4p",
    text: "Chiến lược 4P của nhóm là gì?",
    explanation:
      "Viết bốn phần, mỗi phần kèm lý do chọn:\n" +
      "- Product (sản phẩm): giá trị cốt lõi và các tính năng / dịch vụ chính\n" +
      "- Price (giá): mức giá hoặc các gói, và căn cứ đặt giá (khả năng chi trả của khách, mức sẵn sàng trả qua phỏng vấn)\n" +
      "- Place (kênh phân phối): khách hàng nhận sản phẩm ở đâu, qua kênh nào\n" +
      "- Promotion (truyền thông): thông điệp chính và các hoạt động tiếp cận khách hàng",
    suggested_actions: [
      "Giá có căn cứ từ dữ liệu khách hàng, không chỉ là con số tự đặt.",
    ],
  },

  cp2_ai_disclosure: {
    id: "cp2_ai_disclosure",
    text: "Tuyên bố công bố dùng AI (AI disclosure statement) của nhóm",
    explanation:
      "BẮT BUỘC: thiếu mục này bài sẽ bị trượt. Viết một đoạn nêu rõ nhóm đã dùng AI để làm gì " +
      "(ví dụ gợi ý ý tưởng, sửa câu chữ, phân tích dữ liệu) và liệt kê các prompt đã dùng. " +
      "Nếu nhóm không dùng AI, ghi rõ điều đó.",
    suggested_actions: [
      "Mỗi mục đích dùng AI đi kèm prompt tương ứng.",
    ],
  },

  cp2_harvard_referencing: {
    id: "cp2_harvard_referencing",
    text: "Danh mục tài liệu tham khảo theo chuẩn Harvard",
    explanation:
      "BẮT BUỘC. Mọi số liệu và nguồn bên ngoài phải được trích dẫn trong bài và liệt kê ở danh mục cuối bài theo chuẩn Harvard.\n" +
      "Ví dụ: \"Tác giả (năm) Tên bài. Available at: đường dẫn (Accessed: ngày truy cập).\"",
    suggested_actions: [
      "Mỗi con số thị trường trong bài có một trích dẫn tương ứng ở danh mục.",
    ],
  },

  cp2_appendix: {
    id: "cp2_appendix",
    text: "Phụ lục (Appendix) của nhóm gồm những gì?",
    explanation:
      "BẮT BUỘC. Đính kèm:\n" +
      "- Hồ sơ chuyên gia đã phỏng vấn\n" +
      "- Dữ liệu khảo sát gốc (raw data)\n" +
      "Ẩn thông tin cá nhân và thông tin nhạy cảm của người trả lời khi cần.",
    suggested_actions: [
      "Phần thân bài có chỗ tham chiếu đến phụ lục (ví dụ \"xem Phụ lục A\").",
    ],
  },

  cp2_format: {
    id: "cp2_format",
    text: "Nhóm đã tuân thủ định dạng báo cáo chưa?",
    explanation:
      "BẮT BUỘC. Xác nhận báo cáo đạt các yêu cầu sau:\n" +
      "- Cỡ chữ nội dung 12pt, tiêu đề từ 12pt đến 16pt\n" +
      "- Font Arial hoặc Times New Roman\n" +
      "- Giãn dòng đôi (double-spacing), lề 2,5 cm\n" +
      "- Độ dài từ 5 đến 25 trang",
    suggested_actions: [
      "Mở file cuối cùng và đối chiếu từng yêu cầu trước khi nộp.",
    ],
  },

  cp2_debate_defense: {
    id: "cp2_debate_defense",
    text: "Nhóm chuẩn bị phòng thủ (trả lời phản biện) như thế nào?",
    explanation:
      "Phần này chuẩn bị cho điểm trả lời phản biện. Liệt kê các câu hỏi khó nhất nhóm có thể gặp (khách hàng quá hẹp? SOM có căn cứ không? " +
      "vì sao khách không dùng cách miễn phí?), mỗi câu kèm câu trả lời dùng dữ liệu phỏng vấn sâu hoặc khảo sát làm \"tấm khiên\" " +
      "(ví dụ \"15/25 người phỏng vấn cho biết...\").",
    suggested_actions: [
      "Mỗi câu trả lời trích được một con số hoặc một trích dẫn từ dữ liệu của nhóm.",
    ],
  },

  cp2_debate_attack: {
    id: "cp2_debate_attack",
    text: "Nhóm chuẩn bị tấn công (đặt câu hỏi phản biện) như thế nào?",
    explanation:
      "Phần này chuẩn bị cho điểm đặt câu hỏi phản biện cho nhóm đối diện. Hướng nên soi:\n" +
      "- SOM: có rơi vào lỗi \"chiếm 1% thị trường tỷ đô\" (nêu tỷ lệ nhỏ nhưng không có căn cứ) không?\n" +
      "- Đối thủ vô hình: nhóm kia đã tính đến thói quen \"không làm gì\" chưa?\n" +
      "- Retention: nếu sản phẩm dễ sao chép, vì sao khách hàng ở lại?\n" +
      "Viết 3 đến 5 câu hỏi ngắn, mỗi câu hỏi một ý.",
    suggested_actions: [
      "Mỗi câu hỏi có thể đọc thành lời trong dưới 20 giây.",
    ],
  },
} satisfies Record<string, Question>;

export type QuestionId = keyof typeof QUESTION_REGISTRY;
