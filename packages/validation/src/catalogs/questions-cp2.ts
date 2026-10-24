import type { Question } from "./types.js";

// ---------------------------------------------------------------------------
// CP2 questions — Startup Checkpoint 2 (market research).
// Same wording convention as questions.ts: purpose line → what to cover → example.
// ---------------------------------------------------------------------------

export const CP2_QUESTIONS = {
  cp2_problem_need: {
    id: "cp2_problem_need",
    text: "Vấn đề hoặc nhu cầu khách hàng mà nhóm giải quyết là gì?",
    explanation:
      "Đây là nền của cơ hội kinh doanh. Cơ hội gồm vấn đề hoặc nhu cầu cộng với giải pháp. Cần nêu:\n" +
      "- Ai đang gặp vấn đề, trong tình huống nào\n" +
      "- Vấn đề gây hậu quả gì cho họ\n" +
      "- Vì sao các cách hiện tại chưa giải quyết được\n" +
      "Tránh viết quá chung, ví dụ \"sinh viên cần học tốt hơn\". Nói rõ họ đang kẹt ở bước nào.",
    suggested_actions: [
      "Có ít nhất một tình huống cụ thể và một hậu quả đo được.",
    ],
  },

  cp2_solution: {
    id: "cp2_solution",
    text: "Giải pháp của nhóm là gì?",
    explanation:
      "Mô tả giải pháp giải quyết đúng vấn đề đã nêu ở câu trước. Cần nêu:\n" +
      "- Sản phẩm hoặc dịch vụ làm gì, cho ai\n" +
      "- Khác gì so với cách khách hàng đang dùng\n" +
      "- Nhóm KHÔNG làm gì, tức giới hạn của giải pháp",
    suggested_actions: [
      "Mỗi ý trong giải pháp phải trả lời được: nó giải quyết phần nào của vấn đề?",
    ],
  },

  cp2_opportunity: {
    id: "cp2_opportunity",
    text: "Cơ hội của nhóm là gì?",
    explanation:
      "Cơ hội là vấn đề hoặc nhu cầu cộng với giải pháp. Viết 1 đến 2 đoạn kết hợp hai phần trên, " +
      "giải thích vì sao vấn đề này đủ lớn và giải pháp của nhóm phù hợp để nắm bắt nó.",
    suggested_actions: [
      "Đọc lại: người chưa biết dự án có hiểu vì sao đây là cơ hội không?",
    ],
  },

  cp2_vpc_customer_profile: {
    id: "cp2_vpc_customer_profile",
    text: "Hồ sơ khách hàng: họ cần làm gì, gặp nỗi đau gì, mong muốn gì?",
    explanation:
      "Theo khung Value Proposition Canvas. Trước hết xác định khách hàng mục tiêu và người trực tiếp làm việc với nhóm. " +
      "Nếu khác người ra quyết định, nêu cả hai. Sau đó viết ba phần:\n" +
      "- Customer Jobs: công việc khách hàng đang cố hoàn thành, trong hoàn cảnh nào\n" +
      "- Customer Pains: trở ngại, rủi ro, áp lực khi họ làm việc đó\n" +
      "- Customer Gains: kết quả họ muốn có\n" +
      "Dựa vào dữ liệu phỏng vấn và khảo sát của nhóm, không suy đoán.",
    suggested_actions: [
      "Mỗi phần viết thành đoạn có lý do, không chỉ gạch đầu dòng ngắn.",
    ],
  },

  cp2_vpc_value_map: {
    id: "cp2_vpc_value_map",
    text: "Giá trị sản phẩm: giảm đau và tạo lợi ích như thế nào?",
    explanation:
      "Đối chiếu với hồ sơ khách hàng ở câu trước và viết ba phần:\n" +
      "- Products & Services: các sản phẩm, dịch vụ, gói nhóm cung cấp\n" +
      "- Pain Relievers: sản phẩm xử lý từng Customer Pain như thế nào\n" +
      "- Gain Creators: sản phẩm đem lại từng Customer Gain như thế nào\n" +
      "Nếu có Pain chưa giải quyết được, ghi rõ.",
    suggested_actions: [
      "Mỗi Pain Reliever chỉ rõ nó giải quyết Pain nào; mỗi Gain Creator chỉ rõ Gain nào.",
    ],
  },

  cp2_research_objectives: {
    id: "cp2_research_objectives",
    text: "Mục tiêu nghiên cứu của nhóm là gì?",
    explanation:
      "Viết mục tiêu nghiên cứu thành các câu hỏi cụ thể, thường khoảng 3 đến 5 câu, nhằm kiểm chứng:\n" +
      "- Vấn đề có thật sự tồn tại không\n" +
      "- Khách hàng đang tự xử lý bằng cách nào, vì sao chưa đủ\n" +
      "- Phần nào của giải pháp được đánh giá cao nhất\n" +
      "- Yếu tố nào ảnh hưởng đến quyết định dùng hoặc trả phí\n" +
      "Mỗi câu hỏi phải trả lời được bằng dữ liệu nhóm sẽ thu thập.",
    suggested_actions: [
      "Mỗi câu hỏi nghiên cứu gắn được với ít nhất một nguồn dữ liệu như phỏng vấn hoặc khảo sát.",
    ],
  },

  cp2_customer_discovery_process: {
    id: "cp2_customer_discovery_process",
    text: "Quá trình tìm hiểu khách hàng diễn ra như thế nào?",
    explanation:
      "Mô tả nhóm đã làm gì, theo trình tự nào, thu được gì. Cần nêu:\n" +
      "- Phương pháp, ví dụ phỏng vấn sâu, số người, nhóm đối tượng, thời lượng mỗi cuộc\n" +
      "- Nội dung chính đã hỏi\n" +
      "- Cách tổng hợp dữ liệu, ví dụ gom câu trả lời theo chủ đề lặp lại\n" +
      "- Giới hạn của mẫu: không đại diện cho toàn thị trường nếu chỉ khảo sát một nhóm hẹp\n" +
      "Kết quả nên trình bày theo bảng gồm các cột Chủ đề, Bằng chứng, Quan sát, Insight, " +
      "rồi rút ra các pain point chính và một đoạn customer insight tổng kết.",
    suggested_actions: [
      "Mỗi insight có bằng chứng kèm con số, ví dụ \"15/25 người nhắc đến...\".",
    ],
  },

  cp2_expert_interviews: {
    id: "cp2_expert_interviews",
    text: "Nhóm đã phỏng vấn chuyên gia nào và học được gì?",
    explanation:
      "Mục quan trọng khi chấm điểm: cần ít nhất 2 cuộc phỏng vấn trực tiếp, chuyên gia hoặc khách hàng mục tiêu đều được. " +
      "Nếu nhóm chỉ phỏng vấn khách hàng mục tiêu, ghi rõ điều đó ở đây và trình bày chi tiết ở mục Khám phá khách hàng.\n" +
      "Với mỗi chuyên gia đã phỏng vấn, nêu:\n" +
      "- Hồ sơ: họ tên, chức danh, đơn vị và lý do người này phù hợp với lĩnh vực của dự án\n" +
      "- Learning points, tức điều học được:\n" +
      "  + Market view: góc nhìn của chuyên gia về thị trường\n" +
      "  + Beware-of: điều chuyên gia cảnh báo cần tránh\n" +
      "  + Experience with target customers: kinh nghiệm của chuyên gia với nhóm khách hàng mục tiêu\n" +
      "  + Các điểm khác đáng chú ý",
    suggested_actions: [
      "Có đủ ít nhất 2 cuộc phỏng vấn trực tiếp; mỗi cuộc nêu người được hỏi và lý do phù hợp.",
      "Mỗi cuộc có điều học được cụ thể và nhóm đã đổi gì nhờ đó.",
    ],
  },

  cp2_survey: {
    id: "cp2_survey",
    text: "Nhóm đã khảo sát như thế nào và kết quả ra sao?",
    explanation:
      "TÙY CHỌN. Nếu nhóm có làm khảo sát thì nên có ít nhất 100 người trả lời. Phỏng vấn trực tiếp khách hàng và chuyên gia " +
      "có giá trị hơn khảo sát Google Form, nên ưu tiên nói chuyện trực tiếp. Nếu có khảo sát, cần nêu đủ:\n" +
      "- Mục tiêu và đối tượng khảo sát\n" +
      "- Phương pháp và công cụ sử dụng\n" +
      "- Bảng hỏi: ít nhất 7 câu và ít nhất 2 loại câu hỏi, ví dụ trắc nghiệm, thang đo mức độ, câu hỏi mở\n" +
      "- Cách tuyển người trả lời và ưu đãi nếu có\n" +
      "- Thông tin cá nhân: nếu form thu email hoặc họ tên thì nêu cách bảo mật và việc xin đồng ý; nếu không thu thì ghi rõ là ẩn danh\n" +
      "- Lưu trữ dữ liệu và đồng thuận có hiểu biết của người trả lời\n" +
      "- Phương pháp chọn mẫu và tỷ lệ phản hồi\n" +
      "- Phân tích kết quả và kết luận",
    suggested_actions: [
      "Nếu có khảo sát: đếm lại số người trả lời ≥100, số câu hỏi ≥7, có ≥2 loại câu hỏi.",
      "Mỗi gạch đầu dòng trong phần \"Cần nêu đủ\" đều có câu trả lời riêng.",
    ],
  },

  cp2_question_bank: {
    id: "cp2_question_bank",
    text: "Bộ câu hỏi phỏng vấn khách hàng, phỏng vấn chuyên gia và khảo sát",
    explanation:
      "Ghi lại bản nháp bộ câu hỏi nhóm dùng. Chỉ ghi phần nhóm thật sự làm, ít nhất một phần; phần nào không làm thì bỏ qua:\n" +
      "- Câu hỏi phỏng vấn khách hàng mục tiêu, nếu có phỏng vấn khách hàng\n" +
      "- Câu hỏi phỏng vấn chuyên gia, nếu có phỏng vấn chuyên gia\n" +
      "- Bảng hỏi khảo sát, nếu có khảo sát; với mỗi câu ghi loại câu như trắc nghiệm, thang đo, câu hỏi mở, và các phương án trả lời\n" +
      "Với mỗi câu, chỉ ra câu phục vụ câu hỏi nghiên cứu nào ở mục mục tiêu nghiên cứu. Nexus dùng phần này để góp ý bảng hỏi trước khi nhóm đi hỏi thật.",
    suggested_actions: [
      "Mỗi câu có ghi câu hỏi nghiên cứu mà nó phục vụ.",
      "Nếu có khảo sát, mỗi câu khảo sát ghi loại câu và đủ phương án trả lời.",
    ],
  },

  cp2_pain_point_interviews: {
    id: "cp2_pain_point_interviews",
    text: "Nhóm đã phỏng vấn về nỗi đau của khách hàng chưa?",
    explanation:
      "KHÔNG BẮT BUỘC, nhưng giúp bài vững hơn. Nếu làm: phỏng vấn ít nhất 10 người cho mỗi nhóm liên quan, " +
      "ví dụ người dùng, người trả tiền, đối tác, " +
      "rồi tổng hợp bằng 3 câu hỏi: Có nỗi đau thật không? Nỗi đau đó là gì? Có nhiều người gặp không?",
    suggested_actions: [
      "Nếu làm, mỗi nhóm liên quan có kết quả riêng trước khi viết phần tổng hợp 3 câu.",
    ],
  },

  cp2_tam_sam_som: {
    id: "cp2_tam_sam_som",
    text: "Quy mô thị trường TAM, SAM, SOM là bao nhiêu?",
    explanation:
      "Ước lượng ba tầng, mỗi tầng kèm cách tính và nguồn số liệu:\n" +
      "- TAM, tổng thị trường: toàn bộ khách hàng có thể có × giá dịch vụ\n" +
      "- SAM, thị trường có thể phục vụ: phần của TAM nhóm thực sự tiếp cận được ở giai đoạn đầu, theo khu vực, nhóm khách hàng, kênh\n" +
      "- SOM, thị trường có thể chiếm: tính bottom-up theo chuỗi: kênh tiếp cận → số người tiếp cận được qua mỗi kênh → tỷ lệ tải hoặc dùng thử → tỷ lệ trả phí → × giá\n" +
      "Không viết kiểu \"chỉ cần chiếm 1% thị trường\" mà không có căn cứ. Mỗi con số trong chuỗi cần có căn cứ: số liệu đã tra hoặc kết quả phỏng vấn, khảo sát của nhóm.",
    suggested_actions: [
      "Mỗi con số có nguồn trích dẫn hoặc công thức tính kèm theo.",
      "Chỉ rõ SOM nhỏ hơn SAM và lý do.",
    ],
    further_reading: [
      {
        url: "https://nexusforstartup.site/news/cach-tinh-tam-sam-som-cuc-don-gian-cho-du-an-khoi-nghiep",
        title: "Cách tính TAM, SAM, SOM cực đơn giản cho dự án khởi nghiệp",
      },
    ],
  },

  cp2_competitive_analysis: {
    id: "cp2_competitive_analysis",
    text: "Phân tích cạnh tranh của nhóm",
    explanation:
      "Phân loại đối thủ theo bốn nhóm:\n" +
      "- Direct: cùng giải pháp\n" +
      "- Indirect: giải quyết cùng vấn đề bằng cách khác\n" +
      "- Substitute: thay thế\n" +
      "- New entrants: người mới có thể vào\n" +
      "Với mỗi nhóm, nêu ưu và nhược điểm, và so sánh với nhóm mình. Sau đó nêu:\n" +
      "- Actionables: nhóm sẽ làm gì khác đi vì phân tích này\n" +
      "- Commonalities: điểm chung rút ra từ các đối thủ, ví dụ cùng thiếu điều gì",
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
      "Với mỗi đối thủ vô hình, nêu cách nhóm thuyết phục khách đổi thói quen, " +
      "ví dụ bản dùng thử miễn phí, báo cáo mẫu.",
    suggested_actions: [
      "Mỗi đối thủ vô hình kèm một cách xử lý cụ thể.",
    ],
  },

  cp2_competitor_criteria_table: {
    id: "cp2_competitor_criteria_table",
    text: "Bảng tiêu chí so sánh đối thủ",
    explanation:
      "KHÔNG BẮT BUỘC, nhưng giúp bài vững hơn. Lập bảng so sánh theo các tiêu chí, " +
      "khoảng 9 đối thủ cùng startup của nhóm.\n" +
      "Chọn tiêu chí khách hàng thật sự quan tâm, ví dụ giá, tốc độ, độ phù hợp với bối cảnh.",
    suggested_actions: [
      "Dùng cùng bộ tiêu chí cho mọi hàng, có hàng của nhóm để đối chiếu.",
    ],
  },

  cp2_iteration_refinement: {
    id: "cp2_iteration_refinement",
    text: "Nhóm đã tinh chỉnh sản phẩm từ phản hồi khách hàng như thế nào?",
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
      "Nêu những điều ngoài dự đoán khi làm việc với khách hàng, và pivot, tức thay đổi hướng, nếu có: " +
      "đổi tính năng, đổi từ B2C sang B2B, đổi kênh phân phối.\n" +
      "Nếu nhóm không pivot, ghi rõ \"không pivot\" và vì sao hướng hiện tại vẫn phù hợp.",
    suggested_actions: [
      "Có ít nhất một bất ngờ kèm bằng chứng, hoặc lý do rõ ràng nếu không có.",
    ],
  },

  cp2_pmf_signals: {
    id: "cp2_pmf_signals",
    text: "Dấu hiệu Product-Market Fit ban đầu của nhóm là gì?",
    explanation:
      "Product-Market Fit, gọi tắt PMF, là mức sản phẩm đáp ứng đúng nhu cầu của thị trường. Nêu dấu hiệu ban đầu kèm số liệu cụ thể:\n" +
      "- Sự hài lòng của khách hàng: trích lời hoặc điểm đánh giá\n" +
      "- Tín hiệu nhu cầu: số người đăng ký, sẵn sàng giới thiệu, sẵn sàng trả phí\n" +
      "- Retention: tỷ lệ khách hàng quay lại dùng tiếp\n" +
      "Nêu rõ cỡ mẫu. Nếu mẫu nhỏ, gọi đó là tín hiệu ban đầu, không khẳng định đã đạt PMF.",
    suggested_actions: [
      "Mỗi dấu hiệu có con số kèm cỡ mẫu, ví dụ \"7/9 nhóm...\".",
    ],
  },

  cp2_marketing_4p: {
    id: "cp2_marketing_4p",
    text: "Chiến lược 4P của nhóm là gì?",
    explanation:
      "Viết bốn phần, mỗi phần kèm lý do chọn:\n" +
      "- Product, sản phẩm: giá trị cốt lõi và các tính năng, dịch vụ chính\n" +
      "- Price, giá: mức giá hoặc các gói, và căn cứ đặt giá như khả năng chi trả của khách, mức sẵn sàng trả qua phỏng vấn\n" +
      "- Place, kênh phân phối: khách hàng nhận sản phẩm ở đâu, qua kênh nào\n" +
      "- Promotion, truyền thông: thông điệp chính và các hoạt động tiếp cận khách hàng",
    suggested_actions: [
      "Giá có căn cứ từ dữ liệu khách hàng, không chỉ là con số tự đặt.",
    ],
  },
} satisfies Record<string, Question>;
