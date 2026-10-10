import type { Question } from "./types.js";

// ---------------------------------------------------------------------------
// CP2 questions — Startup Checkpoint 2 (market research + debate).
// Same wording convention as questions.ts: purpose line → what to cover → example.
// ---------------------------------------------------------------------------

export const CP2_QUESTIONS = {
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

  cp2_question_bank: {
    id: "cp2_question_bank",
    text: "Bộ câu hỏi phỏng vấn khách hàng, câu hỏi chuyên gia và bảng hỏi khảo sát (bản nháp)",
    explanation:
      "Ghi lại bản nháp bộ câu hỏi nhóm dùng, chia làm 3 phần:\n" +
      "- Phần 1: câu hỏi phỏng vấn khách hàng\n" +
      "- Phần 2: câu hỏi phỏng vấn chuyên gia\n" +
      "- Phần 3: bảng hỏi khảo sát; với mỗi câu ghi loại câu (trắc nghiệm, thang đo, câu hỏi mở) và các phương án trả lời\n" +
      "Với mỗi câu, chỉ ra câu phục vụ câu hỏi nghiên cứu nào ở mục mục tiêu nghiên cứu. Nexus dùng phần này để góp ý bảng hỏi trước khi nhóm đi hỏi thật.",
    suggested_actions: [
      "Mỗi câu có ghi câu hỏi nghiên cứu mà nó phục vụ.",
      "Mỗi câu khảo sát có ghi loại câu và đủ phương án trả lời.",
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
      "- SOM (thị trường có thể chiếm): tính bottom-up theo chuỗi: kênh tiếp cận → số người tiếp cận được qua mỗi kênh → tỷ lệ tải/dùng thử → tỷ lệ trả phí → × giá\n" +
      "Không viết kiểu \"chỉ cần chiếm 1% thị trường\" mà không có căn cứ. Mỗi con số trong chuỗi cần có căn cứ (số liệu đã tra hoặc kết quả phỏng vấn, khảo sát của nhóm).",
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
    further_reading: [
      {
        url: "https://nexusforstartup.site/news/lam-sao-de-viet-tot-hon-trong-thoi-dai-ai-slop-bk5t",
        title: "Làm sao để viết tốt hơn trong thời đại AI slop?",
      },
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
      "BẮT BUỘC: nhóm vẫn phải trả lời phụ lục của mình gồm những gì, hoặc ghi rõ chưa có tệp.\n" +
      "Phụ lục giúp người đọc đối chiếu khi nhóm có tài liệu, có thể gồm:\n" +
      "- Hồ sơ tóm tắt của chuyên gia đã phỏng vấn\n" +
      "- Bảng hỏi và dữ liệu khảo sát đã ẩn thông tin cá nhân\n\n" +
      "Nếu nhóm trao đổi bằng lời hoặc chưa có tệp, hãy trình bày rõ người đã hỏi, cách thực hiện, điều học được và số liệu trong phần thân bài. " +
      "Nexus không bắt buộc tải lên ghi âm, thông tin liên hệ hay dữ liệu khảo sát gốc để được chấm.",
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
