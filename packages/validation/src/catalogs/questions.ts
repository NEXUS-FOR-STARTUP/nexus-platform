import type { Question } from "./types.js";

// ---------------------------------------------------------------------------
// Canonical question registry (plan section 5). One entry per stable question
// id. Every template references ids from this map; `validateCatalog` fails if a
// template references an id that is not here. Ids are stable strings, never
// reused or renumbered.
// ---------------------------------------------------------------------------

export const QUESTION_REGISTRY = {
  // ── CP1 — Startup Checkpoint 1 (idea validation) ─────────────────────────

  cp1_team_name: {
    id: "cp1_team_name",
    text: "Tên nhóm của bạn là gì?",
    explanation:
      "Ghi rõ tên nhóm dự án theo danh sách đăng ký môn học.",
    suggested_actions: ["Điền đúng tên nhóm đã đăng ký."],
  },

  cp1_team_members: {
    id: "cp1_team_members",
    text: "Nhóm gồm những thành viên nào và mỗi người phụ trách công việc gì?",
    explanation:
      "Liệt kê từng thành viên theo dạng: họ tên — vai trò — công việc phụ trách cụ thể. " +
      "Ví dụ: \"Nguyễn Văn A — Trưởng nhóm — phụ trách nghiên cứu khách hàng và phỏng vấn người dùng.\"",
    suggested_actions: [
      "Liệt kê đầy đủ thành viên kèm vai trò và đầu việc cụ thể.",
    ],
  },

  cp1_idea_name: {
    id: "cp1_idea_name",
    text: "Tên ý tưởng / sản phẩm của nhóm là gì?",
    explanation:
      "Tên phải mô tả được sản phẩm, không dùng slogan chung chung. " +
      "Ví dụ không đạt: \"Nền tảng kết nối thông minh.\" " +
      "Ví dụ đạt: \"Ứng dụng đặt chỗ học nhóm theo giờ tại quán cà phê gần trường đại học.\"",
    suggested_actions: [
      "Đặt tên mô tả đúng sản phẩm, tránh slogan mơ hồ.",
    ],
  },

  cp1_primary_customer: {
    id: "cp1_primary_customer",
    text: "Khách hàng chính của nhóm là ai?",
    explanation:
      "Mô tả đủ hẹp để nhóm tìm được người thật trong vòng một tuần. Cần trả lời đủ: " +
      "họ là ai, độ tuổi bao nhiêu, hoạt động trong bối cảnh nào, hành vi cụ thể liên quan đến vấn đề là gì, " +
      "khả năng chi trả ở mức nào, và lý do nhóm chọn nhóm người này trước tiên. " +
      "Ví dụ không đạt: \"Sinh viên\", \"Người đi làm\". " +
      "Ví dụ đạt: \"Sinh viên đại học năm 2 đến năm 3 tại TP.HCM, thường học nhóm 3 đến 6 người sau giờ học " +
      "ít nhất hai lần mỗi tuần để làm bài tập nhóm, có thể chi khoảng 30 đến 50 nghìn mỗi buổi.\"",
    suggested_actions: [
      "Mô tả đủ 6 yếu tố: là ai, độ tuổi, bối cảnh, hành vi, khả năng chi trả, lý do chọn trước.",
      "Đảm bảo có thể tìm được người thật để phỏng vấn trong 1 tuần.",
    ],
  },

  cp1_non_priority_customer: {
    id: "cp1_non_priority_customer",
    text: "Ai không phải là khách hàng ưu tiên trong giai đoạn đầu?",
    explanation:
      "Ghi rõ nhóm nào nhóm chưa phục vụ và lý do cụ thể. Đây không phải phần để liệt kê ai nhóm không thích — " +
      "mà là để nhóm tự biết mình đang cố tình bỏ ai ra ngoài và vì sao quyết định đó hợp lý trong giai đoạn đầu.",
    suggested_actions: [
      "Liệt kê nhóm bị loại và nêu lý do chiến lược cụ thể.",
    ],
  },

  cp1_role_breakdown: {
    id: "cp1_role_breakdown",
    text: "Các vai trong ý tưởng (User, Customer, Payer, Partner) là ai?",
    explanation:
      "Nếu chỉ có một bên duy nhất, ghi rõ: \"Chỉ có một bên duy nhất.\" Nếu có nhiều bên, mô tả từng vai theo cấu trúc: " +
      "\"[Tên vai] là [mô tả họ là ai]. Pain riêng của họ là [vấn đề họ gặp]. Lợi ích khi tham gia là [điều họ được]. " +
      "Lý do họ sẽ tham gia là [động lực cụ thể].\" Bốn vai cần xác định: User, Customer, Payer, Partner. " +
      "Nếu một bên vừa là User vừa là Payer, ghi rõ. Không được gộp lợi ích của nhiều bên thành một mô tả chung.",
    suggested_actions: [
      "Xác định 4 vai User / Customer / Payer / Partner, ghi rõ nếu trùng nhau.",
      "Mô tả từng vai theo pain, lợi ích, động lực riêng.",
    ],
  },

  cp1_customer_story: {
    id: "cp1_customer_story",
    text: "Câu chuyện về một khách hàng tiêu biểu cụ thể là gì?",
    explanation:
      "Kể về một người dùng tiêu biểu cụ thể — có tên, tuổi, bối cảnh, mục tiêu, rào cản. " +
      "Câu chuyện phải đủ cụ thể để hình dung được người thật. " +
      "Ví dụ không đạt: \"Người dùng là sinh viên gặp khó khăn khi học nhóm.\" " +
      "Ví dụ đạt: \"Minh, 20 tuổi, sinh viên năm 2 tại TP.HCM. Minh thường học nhóm 4 người vào tối thứ Ba và thứ Năm. " +
      "Mỗi lần tìm chỗ, Minh phải nhắn tin hỏi mấy bạn, đi thử 2 đến 3 quán rồi mới biết còn bàn lớn và có ổ điện không. " +
      "Hôm deadline môn Marketing, cả nhóm mất gần một tiếng tìm chỗ trước khi ngồi được.\"",
    suggested_actions: [
      "Viết câu chuyện có tên, tuổi, bối cảnh, mục tiêu, rào cản cụ thể.",
    ],
  },

  cp1_main_problem: {
    id: "cp1_main_problem",
    text: "Vấn đề chính của khách hàng là gì?",
    explanation:
      "Viết rõ vấn đề xảy ra trong tình huống nào, tần suất bao nhiêu, hậu quả cụ thể là gì — " +
      "tính bằng thời gian, tiền bạc, rủi ro, hoặc cơ hội bị mất. Đây là vấn đề của khách hàng, không phải quan sát của nhóm. " +
      "Ví dụ không đạt: \"Sinh viên mất thời gian tìm chỗ học nhóm.\" " +
      "Ví dụ đạt: \"Sinh viên năm 2 đến năm 3 phải mất 30 đến 60 phút để tìm chỗ học nhóm mỗi khi gần deadline. " +
      "Nếu không tìm được chỗ phù hợp, cả nhóm phải ngồi tạm hoặc đổi địa điểm nhiều lần, khiến buổi học bị trễ và mọi người mất tập trung.\"",
    suggested_actions: [
      "Nêu tình huống, tần suất, hậu quả đo được (thời gian / tiền / rủi ro).",
      "Viết theo góc nhìn vấn đề của khách hàng, không phải quan sát của nhóm.",
    ],
  },

  cp1_problem_severity: {
    id: "cp1_problem_severity",
    text: "Vì sao vấn đề này đủ đau để khách hàng chủ động tìm giải pháp?",
    explanation:
      "Trả lời thẳng: đây là vấn đề thật hay chỉ là \"hơi bất tiện\"? Điều gì xảy ra nếu không giải quyết? " +
      "Tần suất vấn đề lặp lại có đủ để khách hàng chịu thay đổi hành vi không?",
    suggested_actions: [
      "Phân biệt \"vấn đề thật\" với \"hơi bất tiện\".",
      "Nêu hậu quả nếu không giải quyết và tần suất lặp lại.",
    ],
  },

  cp1_current_alternatives: {
    id: "cp1_current_alternatives",
    text: "Hiện tại khách hàng đang dùng cách nào để giải quyết vấn đề?",
    explanation:
      "Liệt kê tất cả cách khách hàng đang tự xử lý vấn đề — kể cả \"không làm gì\" hoặc \"chấp nhận sống chung với vấn đề.\" " +
      "Mỗi cách viết thành một câu rõ ràng mô tả họ đang làm gì cụ thể.",
    suggested_actions: [
      "Liệt kê mọi cách hiện tại, kể cả \"không làm gì\".",
    ],
  },

  cp1_alternatives_analysis: {
    id: "cp1_alternatives_analysis",
    text: "Phân tích từng cách khách hàng đang dùng hiện tại?",
    explanation:
      "Với mỗi cách khách hàng đang dùng, phân tích theo bốn chiều: cách đó có tốn tiền không và bao nhiêu, " +
      "có tốn thời gian không và ở bước nào, bất tiện cụ thể ở đâu trong quy trình, và quan trọng nhất — " +
      "vì sao họ vẫn tiếp tục dùng dù biết nó bất tiện?",
    suggested_actions: [
      "Phân tích mỗi cách theo 4 chiều: tiền, thời gian, bất tiện, lý do vẫn dùng.",
    ],
  },

  cp1_required_improvement: {
    id: "cp1_required_improvement",
    text: "Sản phẩm phải tốt hơn ở điểm nào cụ thể để khách hàng chịu đổi hành vi?",
    explanation:
      "Trả lời thẳng: khách hàng phải thấy khác biệt gì rõ ràng so với cách họ đang làm thì mới chịu chuyển sang dùng sản phẩm của nhóm? " +
      "Không được viết chung chung kiểu \"tiện hơn\" hay \"nhanh hơn\" — phải nói nhanh hơn bao nhiêu, tiện ở bước cụ thể nào.",
    suggested_actions: [
      "Nêu khác biệt đo được (nhanh hơn bao nhiêu, tiện ở bước nào), tránh \"tiện hơn / nhanh hơn\" chung chung.",
    ],
  },

  cp1_solution_description: {
    id: "cp1_solution_description",
    text: "Sản phẩm làm gì, cho ai, trong tình huống nào?",
    explanation:
      "Mô tả sản phẩm theo ba chiều: làm gì cụ thể, cho ai cụ thể, trong tình huống nào cụ thể. " +
      "Không dùng các cụm từ mơ hồ như \"nền tảng thông minh\", \"tối ưu trải nghiệm\", \"AI tự động\", \"all-in-one\", \"kết nối.\" " +
      "Nếu buộc phải dùng, phải định nghĩa vận hành ngay bên dưới: từ này có nghĩa gì cụ thể, ai đánh giá được, đo bằng tiêu chí nào.",
    suggested_actions: [
      "Mô tả theo 3 chiều: làm gì, cho ai, tình huống nào.",
      "Định nghĩa vận hành mọi từ mơ hồ nếu buộc phải dùng.",
    ],
  },

  cp1_solution_mechanism: {
    id: "cp1_solution_mechanism",
    text: "Cơ chế tác động — sản phẩm giảm pain bằng cách nào?",
    explanation:
      "Mô tả theo luồng bốn bước. \"Input\": người dùng cung cấp gì cho sản phẩm? " +
      "\"Xử lý\": sản phẩm làm gì với input đó, theo cơ chế nào? " +
      "\"Output\": người dùng nhận được gì cụ thể? " +
      "\"Hành động\": output đó giúp người dùng làm gì tốt hơn so với trước?",
    suggested_actions: [
      "Viết đủ 4 bước: Input → Xử lý → Output → Hành động.",
    ],
  },

  cp1_core_features: {
    id: "cp1_core_features",
    text: "Tính năng lõi của bản đầu tiên là gì?",
    explanation:
      "Liệt kê từng tính năng nhóm sẽ làm trong bản đầu tiên. Với mỗi tính năng, ghi rõ: " +
      "tính năng đó giải quyết pain nào cụ thể, và có trong bản đầu tiên không. " +
      "Định dạng gợi ý: \"[Tên tính năng] — giải quyết [pain cụ thể] — Có / Không có trong bản đầu.\"",
    suggested_actions: [
      "Liệt kê tính năng kèm pain nó giải quyết và có / không trong bản đầu.",
    ],
  },

  cp1_out_of_scope: {
    id: "cp1_out_of_scope",
    text: "Những gì nhóm chủ động không làm ở giai đoạn đầu?",
    explanation:
      "Bắt buộc phải điền. Nhóm phải biết rõ mình đang cố tình bỏ ra những gì và vì sao. " +
      "Ghi cụ thể từng tính năng hoặc nhóm người dùng mà nhóm chủ động không phục vụ trong giai đoạn đầu, kèm lý do.",
    suggested_actions: [
      "Liệt kê tính năng / nhóm người dùng không phục vụ, kèm lý do.",
    ],
  },

  cp1_riskiest_assumption: {
    id: "cp1_riskiest_assumption",
    text: "Giả định nguy hiểm nhất cần test trước là gì?",
    explanation:
      "Trả lời: nếu giả định này sai, toàn bộ ý tưởng sẽ không hoạt động. " +
      "Chỉ chọn một giả định duy nhất quan trọng nhất, không liệt kê nhiều.",
    suggested_actions: [
      "Chọn đúng MỘT giả định mà nếu sai thì ý tưởng sụp đổ.",
    ],
  },

  cp1_mvp_definition: {
    id: "cp1_mvp_definition",
    text: "MVP của nhóm là gì?",
    explanation:
      "Mô tả bản test nhỏ nhất — có thể là Google Form, landing page, Zalo, Notion, hoặc concierge MVP (làm thủ công). " +
      "Không phải app đầy đủ. Giải thích tại sao cách này đủ để kiểm chứng giả định nguy hiểm nhất.",
    suggested_actions: [
      "Mô tả bản test nhỏ nhất (form / landing page / thủ công), không phải app đầy đủ.",
      "Giải thích vì sao cách này đủ test giả định nguy hiểm nhất.",
    ],
  },

  cp1_mvp_test_plan: {
    id: "cp1_mvp_test_plan",
    text: "Test MVP với ai, ở đâu, khi nào?",
    explanation:
      "Cụ thể đến mức có thể hành động ngay. Ví dụ đạt: \"10 đến 15 sinh viên năm 2 đến năm 3 tại Đại học Kinh tế TP.HCM, " +
      "tìm qua nhóm Facebook lớp học, test trong tuần từ ngày 14 đến ngày 20 tháng này.\"",
    suggested_actions: [
      "Nêu rõ ai, ở đâu, khi nào với số lượng và kênh tìm người cụ thể.",
    ],
  },

  cp1_mvp_pass_fail: {
    id: "cp1_mvp_pass_fail",
    text: "Tiêu chí pass và fail của MVP là gì?",
    explanation:
      "Viết thành ba đoạn rõ ràng. \"Pass\": kết quả nào, cụ thể và đo được, chứng minh giả định đúng? " +
      "\"Fail\": kết quả nào chứng minh giả định sai? " +
      "\"Học được gì nếu fail\": nếu kết quả là fail, nhóm sẽ điều chỉnh theo hướng nào?",
    suggested_actions: [
      "Xác định rõ Pass (số đo được), Fail, và hướng điều chỉnh nếu fail.",
    ],
  },

  cp1_evidence_assumptions: {
    id: "cp1_evidence_assumptions",
    text: "Đâu là dữ liệu thực tế (bằng chứng), đâu là giả định chưa kiểm chứng?",
    explanation:
      "Viết thành hai phần rõ ràng. Phần một — \"Những điều nhóm biết từ dữ liệu thực tế\": liệt kê từng điều kèm nguồn gốc " +
      "(phỏng vấn bao nhiêu người, khảo sát từ đâu, quan sát ở đâu; bằng chứng theo loại: phỏng vấn, khảo sát, quan sát thực tế, " +
      "thử nghiệm, số liệu thứ cấp kèm nguồn và năm). Phần hai — \"Những điều nhóm đang giả định và chưa kiểm chứng\": liệt kê từng giả định, " +
      "nêu \"nếu giả định này sai thì điều gì xảy ra\" và \"cách test nhỏ nhất để kiểm chứng\". " +
      "Nếu chưa có bằng chứng nào, ghi thẳng: \"Chưa có bằng chứng. Toàn bộ phần dưới là giả định cần kiểm chứng.\"",
    suggested_actions: [
      "Liệt kê bằng chứng theo loại kèm nguồn gốc (phỏng vấn / khảo sát / quan sát / thứ cấp).",
      "Liệt kê từng giả định kèm tác động nếu sai và cách test nhỏ nhất.",
      "Nếu chưa có gì, ghi rõ \"Chưa có bằng chứng\" thay vì để trống.",
    ],
  },

  cp1_revenue_model: {
    id: "cp1_revenue_model",
    text: "Mô hình doanh thu dự kiến là gì?",
    explanation:
      "Ở Checkpoint 1 chưa cần chứng minh doanh thu thật, nhưng phải xác định được ai có thể trả tiền và vì lý do gì. " +
      "Nếu người trả tiền không phải người dùng, phải giải thích vì sao họ có động lực trả. Trả lời bốn câu hỏi: " +
      "Ai là người trả tiền? Họ trả vì nhận được giá trị gì cụ thể? Hình thức thu tiền (một lần, định kỳ, theo lượt dùng, hoa hồng)? " +
      "Đây là dữ liệu thực tế hay giả định?",
    suggested_actions: [
      "Xác định ai trả tiền, giá trị họ nhận, hình thức thu, và dữ liệu / giả định.",
    ],
  },

  // ── CP2 — Startup Checkpoint 2 (market research + debate) ─────────────────

  cp2_problem_need: {
    id: "cp2_problem_need",
    text: "Vấn đề / Nhu cầu khách hàng mà nhóm giải quyết là gì?",
    explanation:
      "Nêu rõ vấn đề hoặc nhu cầu khách hàng — nền tảng của cơ hội (Cơ hội = Vấn đề/Nhu cầu + Giải pháp).",
    suggested_actions: ["Mô tả vấn đề / nhu cầu khách hàng cụ thể."],
  },

  cp2_solution: {
    id: "cp2_solution",
    text: "Giải pháp của nhóm là gì?",
    explanation:
      "Mô tả giải pháp nhóm đề xuất để giải quyết vấn đề / nhu cầu đã xác định.",
    suggested_actions: ["Mô tả giải pháp cụ thể gắn với vấn đề."],
  },

  cp2_opportunity: {
    id: "cp2_opportunity",
    text: "Cơ hội của nhóm là gì?",
    explanation:
      "Cơ hội = Vấn đề/Nhu cầu + Giải pháp. Nêu rõ vì sao sự kết hợp này tạo ra cơ hội kinh doanh.",
    suggested_actions: ["Kết hợp rõ Vấn đề + Giải pháp thành cơ hội."],
  },

  cp2_vpc_customer_profile: {
    id: "cp2_vpc_customer_profile",
    text: "Value Proposition Canvas — Bức tranh Khách hàng (Jobs to be done, Pains, Gains)?",
    explanation:
      "Xác định Jobs to be done (công việc khách muốn hoàn thành), Pains (nỗi đau), Gains (lợi ích mong muốn) của khách hàng mục tiêu.",
    suggested_actions: ["Liệt kê Jobs, Pains, Gains của khách hàng."],
  },

  cp2_vpc_value_map: {
    id: "cp2_vpc_value_map",
    text: "Value Proposition Canvas — Bức tranh Sản phẩm (Products & Services, Pain Relievers, Gain Creators)?",
    explanation:
      "Xác định Products & Services, Pain Relievers (giảm đau), Gain Creators (tạo lợi ích) mà sản phẩm cung cấp, đối chiếu với bức tranh khách hàng.",
    suggested_actions: [
      "Liệt kê Products / Services, Pain Relievers, Gain Creators.",
    ],
  },

  cp2_research_objectives: {
    id: "cp2_research_objectives",
    text: "Mục tiêu nghiên cứu (câu hỏi nghiên cứu cụ thể) là gì?",
    explanation:
      "Nêu mục tiêu nghiên cứu khách hàng dưới dạng các câu hỏi nghiên cứu cụ thể, rõ ràng.",
    suggested_actions: [
      "Viết mục tiêu nghiên cứu thành các câu hỏi nghiên cứu cụ thể.",
    ],
  },

  cp2_customer_discovery_process: {
    id: "cp2_customer_discovery_process",
    text: "Quá trình Khám phá khách hàng (Customer Discovery) diễn ra như thế nào?",
    explanation:
      "Mô tả quá trình thực hiện Customer Discovery: đã làm gì, theo trình tự nào, thu được gì.",
    suggested_actions: [
      "Mô tả các bước Customer Discovery và kết quả thu được.",
    ],
  },

  cp2_expert_interviews: {
    id: "cp2_expert_interviews",
    text: "Nhóm đã phỏng vấn chuyên gia nào và học được gì?",
    explanation:
      "BẮT BUỘC — trượt nếu thiếu. Phải phỏng vấn ít nhất 2 chuyên gia, mỗi người có ≥6 tháng kinh nghiệm. " +
      "Với mỗi chuyên gia: hồ sơ (profile) và thông tin liên hệ, cùng các learning points: market view (góc nhìn thị trường), " +
      "beware-of (điều cần cảnh giác), experience with target customers (kinh nghiệm với khách hàng mục tiêu), và các điểm khác.",
    suggested_actions: [
      "Phỏng vấn ≥2 chuyên gia, mỗi người ≥6 tháng kinh nghiệm.",
      "Ghi hồ sơ + liên hệ và learning points (market view, beware-of, kinh nghiệm với khách hàng mục tiêu).",
    ],
  },

  cp2_survey: {
    id: "cp2_survey",
    text: "Nhóm đã thực hiện khảo sát (survey) như thế nào và kết quả ra sao?",
    explanation:
      "BẮT BUỘC — trượt nếu thiếu. Khảo sát phải đạt ≥100 người trả lời. Cần nêu đầy đủ: mục tiêu và đối tượng khảo sát, " +
      "phương pháp, thiết kế bảng hỏi (≥2 loại câu hỏi và ≥7 câu), cách tuyển người trả lời, ưu đãi (incentives), " +
      "ẩn danh (phần demographic + email bắt buộc), công cụ sử dụng, lưu trữ dữ liệu, đồng thuận có hiểu biết (informed consent), " +
      "phương pháp chọn mẫu / tỷ lệ phản hồi, phân tích, và kết luận.",
    suggested_actions: [
      "Đảm bảo ≥100 người trả lời.",
      "Nêu đủ: mục tiêu, phương pháp, bảng hỏi ≥7 câu ≥2 loại, tuyển người, incentives, ẩn danh (demographic + email), công cụ, lưu trữ, consent, chọn mẫu, phân tích, kết luận.",
    ],
  },

  cp2_pain_point_interviews: {
    id: "cp2_pain_point_interviews",
    text: "[Không bắt buộc] Nhóm đã phỏng vấn pain point chưa?",
    explanation:
      "Không bắt buộc. Nếu làm: ≥10 người phỏng vấn mỗi nhóm liên quan (stakeholder), " +
      "tổng hợp 3 câu: có nỗi đau thật không? nỗi đau đó là gì? có nhiều người gặp không?",
    suggested_actions: [
      "Nếu làm, phỏng vấn ≥10 / stakeholder và tổng hợp 3 câu: có đau thật, là gì, có nhiều không.",
    ],
  },

  cp2_tam_sam_som: {
    id: "cp2_tam_sam_som",
    text: "Quy mô thị trường TAM / SAM / SOM của nhóm là bao nhiêu?",
    explanation:
      "Ước lượng TAM (tổng thị trường), SAM (thị trường có thể phục vụ), SOM (thị trường có thể chiếm). " +
      "Khuyến khích dùng cách tính bottom-up cho SOM.",
    suggested_actions: ["Tính TAM, SAM, SOM; ưu tiên bottom-up cho SOM."],
  },

  cp2_porters_five_forces: {
    id: "cp2_porters_five_forces",
    text: "Phân tích Porter's Five Forces cho thị trường của nhóm?",
    explanation:
      "Phân tích 5 lực lượng: rivalry (cạnh tranh nội bộ), new entrants (người mới), substitution (sản phẩm thay thế), " +
      "buyer power (quyền lực người mua), supplier power (quyền lực nhà cung cấp), và vị trí phòng thủ của nhóm.",
    suggested_actions: ["Phân tích đủ 5 lực lượng + vị trí phòng thủ."],
  },

  cp2_competitive_analysis: {
    id: "cp2_competitive_analysis",
    text: "Phân tích cạnh tranh (Competitive Analysis Framework) của nhóm?",
    explanation:
      "Phân loại đối thủ theo Direct / Indirect / Substitute / New entrants, " +
      "nêu các hành động cụ thể (Actionables) và điểm chung (commonalities) rút ra.",
    suggested_actions: [
      "Phân loại Direct / Indirect / Substitute / New entrants + Actionables + commonalities.",
    ],
  },

  cp2_invisible_competitors: {
    id: "cp2_invisible_competitors",
    text: "Đối thủ vô hình của nhóm là gì?",
    explanation:
      "Xác định đối thủ vô hình: sự trì hoãn, \"không làm gì cả\", thói quen hiện tại — " +
      "và cách nhóm thuyết phục khách đổi thói quen.",
    suggested_actions: [
      "Nêu đối thủ vô hình (trì hoãn, không làm gì, thói quen) và cách thuyết phục đổi thói quen.",
    ],
  },

  cp2_competitor_criteria_table: {
    id: "cp2_competitor_criteria_table",
    text: "[Không bắt buộc] Bảng tiêu chí so sánh đối thủ (Competitors' Criteria Table)?",
    explanation:
      "Không bắt buộc. Nếu làm để đạt điểm tối đa: so sánh theo các tiêu chí (metric), khoảng 9 đối thủ + startup của nhóm.",
    suggested_actions: [
      "Nếu làm, lập bảng theo metric với khoảng 9 đối thủ + startup mình.",
    ],
  },

  cp2_mvp_demo: {
    id: "cp2_mvp_demo",
    text: "Demo MVP / Prototype của nhóm là gì?",
    explanation: "Trình bày demo MVP hoặc prototype hiện có của sản phẩm.",
    suggested_actions: ["Chuẩn bị demo MVP / prototype có thể trình diễn."],
  },

  cp2_iteration_refinement: {
    id: "cp2_iteration_refinement",
    text: "Nhóm đã lặp và tinh chỉnh (Iterating & Refining) từ phản hồi khách hàng như thế nào?",
    explanation:
      "Từ phản hồi khách hàng: giả định nào sai, tính năng nào thêm / bớt / sửa.",
    suggested_actions: [
      "Nêu giả định sai và các tính năng thêm / bớt / sửa từ phản hồi.",
    ],
  },

  cp2_surprises_pivot: {
    id: "cp2_surprises_pivot",
    text: "Nhóm gặp bất ngờ gì và có pivot không?",
    explanation:
      "Nêu các bất ngờ và pivot: đổi tính năng, đổi B2C→B2B, đổi kênh / phân phối.",
    suggested_actions: [
      "Nêu bất ngờ và hướng pivot (tính năng, B2C→B2B, kênh / phân phối).",
    ],
  },

  cp2_pmf_signals: {
    id: "cp2_pmf_signals",
    text: "Dấu hiệu Product-Market Fit ban đầu của nhóm là gì?",
    explanation:
      "Nêu dấu hiệu PMF: sự hài lòng của khách hàng, tín hiệu nhu cầu, retention (tỷ lệ quay lại).",
    suggested_actions: [
      "Nêu dấu hiệu PMF: hài lòng, tín hiệu nhu cầu, retention.",
    ],
  },

  cp2_marketing_4p: {
    id: "cp2_marketing_4p",
    text: "Chiến lược 4P của nhóm là gì?",
    explanation:
      "Nêu 4P: Product (sản phẩm), Price (giá), Promotion (truyền thông), Place (kênh phân phối).",
    suggested_actions: ["Xác định rõ Product, Price, Promotion, Place."],
  },

  cp2_ai_disclosure: {
    id: "cp2_ai_disclosure",
    text: "Tuyên bố công bố dùng AI (AI disclosure statement) của nhóm?",
    explanation:
      "BẮT BUỘC — trượt nếu thiếu. Viết đoạn nêu rõ dùng AI để làm gì + các prompt đã dùng.",
    suggested_actions: [
      "Nêu rõ dùng AI làm gì + liệt kê prompt đã dùng.",
    ],
  },

  cp2_harvard_referencing: {
    id: "cp2_harvard_referencing",
    text: "Danh mục tài liệu tham khảo theo chuẩn Harvard?",
    explanation:
      "BẮT BUỘC. Trích dẫn nguồn theo chuẩn Harvard referencing.",
    suggested_actions: ["Lập danh mục tham khảo đúng chuẩn Harvard."],
  },

  cp2_appendix: {
    id: "cp2_appendix",
    text: "Phụ lục (Appendix) của nhóm gồm những gì?",
    explanation:
      "BẮT BUỘC. Đính kèm hồ sơ chuyên gia và dữ liệu survey raw.",
    suggested_actions: ["Đính kèm hồ sơ chuyên gia + dữ liệu survey raw."],
  },

  cp2_format: {
    id: "cp2_format",
    text: "Nhóm đã tuân thủ định dạng báo cáo chưa?",
    explanation:
      "BẮT BUỘC. Định dạng: body 12pt, headings 12-16pt, font Arial/Times New Roman, double-spacing, lề 2.5cm, độ dài 5-25 trang.",
    suggested_actions: [
      "Tuân thủ: 12pt body, 12-16pt headings, Arial/TNR, double-spacing, lề 2.5cm, 5-25 trang.",
    ],
  },

  cp2_debate_defense: {
    id: "cp2_debate_defense",
    text: "Nhóm chuẩn bị phòng thủ (trả lời phản biện) như thế nào?",
    explanation:
      "Chuẩn bị cho cột điểm trả lời phản biện: dùng dữ liệu phỏng vấn sâu làm \"tấm khiên\" để bảo vệ lập luận.",
    suggested_actions: [
      "Chuẩn bị dùng dữ liệu phỏng vấn sâu làm căn cứ phòng thủ.",
    ],
  },

  cp2_debate_attack: {
    id: "cp2_debate_attack",
    text: "Nhóm chuẩn bị tấn công (đặt câu hỏi phản biện) như thế nào?",
    explanation:
      "Chuẩn bị cho cột điểm đặt câu hỏi phản biện: soi SOM (\"chiếm 1% thị trường tỷ đô\" fallacy), " +
      "đối thủ vô hình, và retention nếu sản phẩm dễ sao chép.",
    suggested_actions: [
      "Chuẩn bị câu hỏi về SOM fallacy, đối thủ vô hình, retention nếu dễ sao chép.",
    ],
  },
} satisfies Record<string, Question>;

export type QuestionId = keyof typeof QUESTION_REGISTRY;
