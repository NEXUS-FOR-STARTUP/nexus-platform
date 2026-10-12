import type { Question } from "./types.js";

// ---------------------------------------------------------------------------
// CP3 questions — Startup Checkpoint 3 (MVP + UX/UI, Business Model Canvas, SWOT).
// Source: "HƯỚNG DẪN MVP_BMC_SWOT" (rubric), 101_13_Nexus_CP3 (SWOT + conclusion
// structure) and 101_155_RootAccess_CP3 (UX/UI and BMC structure).
// Same wording convention as questions.ts: purpose line → what to cover → example.
// ---------------------------------------------------------------------------

export const CP3_QUESTIONS = {
  // ── Phần 1 — MVP và trải nghiệm người dùng (UX/UI) ───────────────────────

  cp3_mvp_problem_pitch: {
    id: "cp3_mvp_problem_pitch",
    text: "Vấn đề cốt lõi mà MVP giải quyết là gì?",
    explanation:
      "Đây là phần mở đầu trước khi demo. Nêu ngắn gọn (3 đến 5 câu):\n" +
      "- Ai đang gặp vấn đề và \"nỗi đau\" cụ thể là gì\n" +
      "- Vì sao MVP này là cách giải quyết phù hợp\n" +
      "- Tính năng cốt lõi duy nhất mà phần demo sẽ chứng minh\n" +
      "MVP phải chứng minh sản phẩm giải quyết đúng nỗi đau, không phải ý tưởng trên giấy.",
    suggested_actions: [
      "Người nghe hiểu vấn đề sau 30 giây, chưa cần nhìn sản phẩm.",
    ],
  },

  cp3_mvp_demo_script: {
    id: "cp3_mvp_demo_script",
    text: "Kịch bản demo 5 đến 6 phút: người dùng thao tác trên MVP như thế nào?",
    explanation:
      "Liệt kê từng bước người dùng thao tác để giải quyết vấn đề, theo thứ tự trình diễn:\n" +
      "- Bước nào mở đầu, bước nào chứng minh tính năng cốt lõi\n" +
      "- Ai trình bày từng bước (nếu nhiều người)\n" +
      "- Dữ liệu mẫu dùng khi demo\n" +
      "Chỉ demo tính năng cốt lõi, không trình bày mọi tính năng.",
    suggested_actions: [
      "Đọc thử kịch bản: tổng thời gian nằm trong 5 đến 6 phút.",
      "Có phương án dự phòng nếu mạng hoặc sản phẩm lỗi khi demo.",
    ],
  },

  cp3_user_persona: {
    id: "cp3_user_persona",
    text: "User Persona: người dùng chính của sản phẩm là ai?",
    explanation:
      "Mô tả một nhân vật đại diện, dựa trên khách hàng thật nhóm đã gặp. Gồm:\n" +
      "- Tên, tuổi, nghề nghiệp, bối cảnh\n" +
      "- Mục tiêu họ muốn đạt\n" +
      "- Khó khăn hiện tại\n" +
      "- Nhu cầu đối với sản phẩm\n" +
      "Không đủ: \"sinh viên 18 đến 25 tuổi\". Đủ: một nhân vật có tên, tình huống và mục tiêu riêng.",
    suggested_actions: [
      "Mỗi khó khăn trong persona đều được một tính năng của MVP giải quyết.",
    ],
  },

  cp3_user_flow: {
    id: "cp3_user_flow",
    text: "User Flow: người dùng đi qua những bước nào khi dùng sản phẩm?",
    explanation:
      "Trình bày hành trình từ lúc mở sản phẩm đến lúc đạt mục tiêu, ví dụ: truy cập, đăng ký/đăng nhập, " +
      "dùng tính năng chính, thanh toán (nếu có). Mỗi bước ghi rõ người dùng làm gì và hệ thống phản hồi gì.\n" +
      "Có thể kèm sơ đồ; ở đây viết các bước bằng chữ và ghi đường dẫn tới sơ đồ nếu có.",
    suggested_actions: [
      "Luồng có điểm bắt đầu, điểm kết thúc và nhánh khi hết credit hoặc lỗi (nếu áp dụng).",
    ],
  },

  cp3_wireframe: {
    id: "cp3_wireframe",
    text: "Wireframe: bố cục các màn hình chính được phác thảo như thế nào?",
    explanation:
      "Wireframe là bản phác thảo bố cục, chưa cần màu sắc. Với mỗi màn hình chính nêu:\n" +
      "- Tên màn hình và mục đích\n" +
      "- Các khối nội dung theo thứ tự từ trên xuống\n" +
      "- Hành động chính của người dùng trên màn hình đó\n" +
      "Ghi thêm đường dẫn tới file thiết kế (Figma hoặc tương đương) nếu có.",
    suggested_actions: [
      "Mỗi màn hình có đúng một hành động chính nổi bật.",
    ],
  },

  cp3_mockup: {
    id: "cp3_mockup",
    text: "Mockup / giao diện hoàn chỉnh: màu sắc, font chữ, icon và bố cục được chọn ra sao?",
    explanation:
      "Mockup là giao diện hoàn chỉnh có màu sắc, icon rõ ràng. Nêu:\n" +
      "- Bảng màu và lý do chọn (phù hợp lĩnh vực, nhận diện thương hiệu)\n" +
      "- Font chữ và kiểu icon\n" +
      "- Phong cách bố cục chung\n" +
      "- Các màn hình chính: trang chủ, trang chức năng chính, trang thanh toán/tương tác",
    suggested_actions: [
      "Mỗi lựa chọn thiết kế đi kèm một lý do, không chỉ mô tả.",
    ],
  },

  cp3_ux_logic: {
    id: "cp3_ux_logic",
    text: "UX Logic: vì sao nhóm thiết kế như vậy?",
    explanation:
      "Giải thích được lý do đằng sau các quyết định thiết kế để chứng minh sự thuận tiện cho người dùng. " +
      "Với mỗi quyết định quan trọng, trả lời \"vì sao\":\n" +
      "- Vì sao đặt thanh điều hướng ở vị trí đó\n" +
      "- Vì sao nút hành động chính nằm ở chỗ đó\n" +
      "- Vì sao chia luồng thành các bước như vậy\n" +
      "Không đạt: \"nút này màu xanh cho đẹp\". Đạt: \"nút nằm cạnh nội dung vì đây là thao tác dùng nhiều nhất\".",
    suggested_actions: [
      "Có ít nhất 3 quyết định thiết kế, mỗi quyết định gắn với một hành vi người dùng.",
    ],
  },

  // ── Phần 2 — Business Model Canvas (9 ô) ─────────────────────────────────

  cp3_bmc_customer_segments: {
    id: "cp3_bmc_customer_segments",
    text: "BMC 1 — Phân khúc khách hàng (Customer Segments): khách hàng mục tiêu ưu tiên là ai?",
    explanation:
      "Chọn khách hàng mục tiêu ưu tiên, không chọn phân khúc quá rộng. Nêu:\n" +
      "- Nhóm khách hàng ưu tiên (nhân khẩu học, hành vi, nhu cầu)\n" +
      "- Nhóm khởi đầu (beachhead) để nhóm tập trung trước\n" +
      "Không đạt: \"tất cả sinh viên\". Đạt: \"sinh viên năm 2 đến 4 đang làm Startup Proposal học kỳ này\".",
    suggested_actions: [
      "Phân khúc đủ hẹp để nhóm biết đi gặp ai tuần này.",
    ],
  },

  cp3_bmc_value_proposition: {
    id: "cp3_bmc_value_proposition",
    text: "BMC 2 — Đề xuất giá trị (Value Proposition / USP): sản phẩm mang lại lợi ích độc đáo gì?",
    explanation:
      "Nêu lợi ích khiến nhóm khác biệt và khó bắt chước: tiết kiệm thời gian, giá rẻ hơn, tiện lợi hơn... Cần:\n" +
      "- Một câu USP rõ ràng\n" +
      "- So với cách khách hàng đang dùng, hơn ở điểm nào\n" +
      "- Giá trị này đáp ứng đúng nỗi đau ở phân khúc khách hàng bên trên",
    suggested_actions: [
      "Đối thủ đọc USP này vẫn thấy khó sao chép trong một học kỳ.",
    ],
  },

  cp3_bmc_channels: {
    id: "cp3_bmc_channels",
    text: "BMC 3 — Kênh truyền thông và bán hàng (Channels): làm sao để tiếp cận khách hàng?",
    explanation:
      "Nêu các kênh giao giá trị và tiếp cận khách hàng: website, ứng dụng di động, mạng xã hội, truyền miệng, cộng đồng... " +
      "Chia kênh trực tiếp và kênh gián tiếp nếu có, và ghi kênh nào là kênh chính ở giai đoạn đầu.",
    suggested_actions: [
      "Mỗi kênh có lý do: khách hàng ở phân khúc đã chọn thật sự có mặt ở kênh đó.",
    ],
  },

  cp3_bmc_customer_relationships: {
    id: "cp3_bmc_customer_relationships",
    text: "BMC 4 — Quan hệ khách hàng (Customer Relationships): cách thu hút và giữ chân khách hàng?",
    explanation:
      "Nêu cách nhóm thu hút và giữ khách: cộng đồng, hỗ trợ trực tuyến, tự phục vụ, thẻ thành viên, chương trình giới thiệu... " +
      "Giải thích vì sao cách này hợp với hành vi sử dụng của khách hàng.",
    suggested_actions: [
      "Nêu được điều khiến khách hàng quay lại lần hai.",
    ],
  },

  cp3_bmc_revenue_streams: {
    id: "cp3_bmc_revenue_streams",
    text: "BMC 5 — Dòng doanh thu (Revenue Streams): dự án kiếm tiền bằng cách nào?",
    explanation:
      "Nêu hình thức thu tiền: bán sản phẩm, thu phí dịch vụ, hoa hồng, đăng ký gói, mua credit... Cần:\n" +
      "- Mức giá hoặc gói giá và đơn vị tính\n" +
      "- Vì sao chọn hình thức này và loại bỏ hình thức nào\n" +
      "- Mức giá là giá thử nghiệm hay đã chốt",
    suggested_actions: [
      "Có ít nhất một con số về mức giá và một căn cứ cho mức giá đó.",
    ],
  },

  cp3_bmc_key_resources: {
    id: "cp3_bmc_key_resources",
    text: "BMC 6 — Nguồn lực chính (Key Resources): cần tài sản gì để vận hành?",
    explanation:
      "Liệt kê nguồn lực cần có theo nhóm: tri thức, con người, hạ tầng công nghệ, tài chính, máy móc... " +
      "Chỉ ra nguồn lực nào quan trọng nhất và vì sao khó bị sao chép.",
    suggested_actions: [
      "Mỗi nguồn lực gắn với một hoạt động chính ở ô kế tiếp.",
    ],
  },

  cp3_bmc_key_activities: {
    id: "cp3_bmc_key_activities",
    text: "BMC 7 — Hoạt động chính (Key Activities): những việc quan trọng nhất phải làm là gì?",
    explanation:
      "Nêu các hoạt động quyết định mô hình chạy được: phát triển sản phẩm, marketing, chăm sóc khách hàng, vận hành, cập nhật nội dung... " +
      "Ưu tiên hoạt động tạo ra giá trị cho khách hàng và hoạt động tạo ra doanh thu.",
    suggested_actions: [
      "Mỗi hoạt động trả lời được: nếu bỏ nó thì giá trị nào mất đi?",
    ],
  },

  cp3_bmc_key_partners: {
    id: "cp3_bmc_key_partners",
    text: "BMC 8 — Đối tác chính (Key Partners): ai sẽ hỗ trợ nhóm?",
    explanation:
      "Nêu nhà cung cấp, đơn vị vận chuyển, nền tảng công nghệ, chuyên gia cố vấn, cộng đồng... Với mỗi đối tác ghi:\n" +
      "- Họ cung cấp gì cho nhóm\n" +
      "- Mức độ phụ thuộc và khả năng thay thế\n" +
      "Nếu nhóm chủ động chỉ có ít đối tác, nói rõ lý do.",
    suggested_actions: [
      "Có phương án thay thế nếu một đối tác quan trọng ngừng hỗ trợ.",
    ],
  },

  cp3_bmc_cost_structure: {
    id: "cp3_bmc_cost_structure",
    text: "BMC 9 — Cấu trúc chi phí (Cost Structure): chi phí đầu tư ban đầu và vận hành gồm những gì?",
    explanation:
      "Liệt kê các khoản chi: đầu tư ban đầu và chi phí vận hành (marketing, nhân sự, hạ tầng, máy móc, API...). Chia:\n" +
      "- Chi phí cố định\n" +
      "- Chi phí biến đổi (tăng theo số khách hàng)\n" +
      "Kèm con số ước tính cho các khoản lớn nhất.",
    suggested_actions: [
      "Chi phí và doanh thu ở ô 5 có thể đặt cạnh nhau để thấy mô hình có lãi hay không.",
      "Chín ô BMC liên kết với nhau, không mâu thuẫn (ví dụ kênh ở ô 3 phù hợp phân khúc ở ô 1).",
    ],
  },

  // ── Phần 3 — SWOT và chiến lược ──────────────────────────────────────────

  cp3_swot_strengths: {
    id: "cp3_swot_strengths",
    text: "SWOT — Điểm mạnh (Strengths): lợi thế nội tại của nhóm là gì?",
    explanation:
      "Nêu lợi thế nội tại và USP của nhóm. Mỗi điểm mạnh phải có dữ liệu định lượng đi kèm để chứng minh, " +
      "ví dụ \"9/9 nhóm dùng thử đều sửa được ít nhất một lỗi logic lớn\".\n" +
      "Đánh mã S1, S2, S3 để dùng ở phần chiến lược.",
    suggested_actions: [
      "Mỗi điểm mạnh có một con số hoặc bằng chứng cụ thể.",
    ],
  },

  cp3_swot_weaknesses: {
    id: "cp3_swot_weaknesses",
    text: "SWOT — Điểm yếu (Weaknesses): nhóm còn hạn chế gì từ bên trong?",
    explanation:
      "Nêu các hạn chế nội tại về nhân sự, năng lực, thương hiệu, quy trình, nguồn lực... Mỗi điểm yếu có dữ liệu hoặc ví dụ cụ thể. " +
      "Đánh mã W1, W2, W3.",
    suggested_actions: [
      "Điểm yếu nêu thật, không viết điểm mạnh trá hình (\"làm việc quá chăm chỉ\").",
    ],
  },

  cp3_swot_opportunities: {
    id: "cp3_swot_opportunities",
    text: "SWOT — Cơ hội (Opportunities): nhu cầu thị trường và xu hướng nào đang có lợi?",
    explanation:
      "Nêu các yếu tố bên ngoài thuận lợi: nhu cầu thị trường, xu hướng, khoảng trống mà đối thủ chưa lấp. " +
      "Mỗi cơ hội có dữ liệu định lượng (kết quả khảo sát, quy mô thị trường). Đánh mã O1, O2, O3.",
    suggested_actions: [
      "Mỗi cơ hội có nguồn dữ liệu có thể kiểm chứng.",
    ],
  },

  cp3_swot_threats: {
    id: "cp3_swot_threats",
    text: "SWOT — Thách thức (Threats): đối thủ, rủi ro pháp lý và thị trường nào đe dọa dự án?",
    explanation:
      "Nêu các yếu tố bên ngoài bất lợi: đối thủ cạnh tranh, công nghệ thay đổi, rủi ro pháp luật, mùa vụ, hành vi khách hàng. " +
      "Mỗi thách thức có dữ liệu hoặc ví dụ cụ thể. Đánh mã T1, T2, T3.",
    suggested_actions: [
      "Có ít nhất một thách thức đến từ đối thủ hoặc giải pháp thay thế đã phân tích ở CP2.",
    ],
  },

  cp3_strategy_so: {
    id: "cp3_strategy_so",
    text: "Chiến lược S-O (tấn công): dùng điểm mạnh nào để khai thác cơ hội nào?",
    explanation:
      "Ghép điểm mạnh với cơ hội thành hành động cụ thể. Mỗi chiến lược ghi theo dạng: " +
      "\"S? + O? → hành động\" (ví dụ \"S1 + O3 → dùng kết quả điểm số của 9 nhóm làm bằng chứng để thu hút nhóm mới\").",
    suggested_actions: [
      "Mỗi chiến lược nêu rõ mã S và O được ghép.",
    ],
  },

  cp3_strategy_st: {
    id: "cp3_strategy_st",
    text: "Chiến lược S-T (phòng thủ): dùng điểm mạnh nào để đối phó thách thức nào?",
    explanation:
      "Ghép điểm mạnh với thách thức để giảm tác động xấu. Dạng \"S? + T? → hành động\". " +
      "Hành động phải cụ thể và làm được trong thời gian của dự án.",
    suggested_actions: [
      "Mỗi chiến lược nêu rõ mã S và T được ghép.",
    ],
  },

  cp3_strategy_wo: {
    id: "cp3_strategy_wo",
    text: "Chiến lược W-O (cải thiện): khắc phục điểm yếu nào để nắm bắt cơ hội nào?",
    explanation:
      "Ghép điểm yếu với cơ hội: nhóm cần sửa điều gì để đủ năng lực nắm bắt cơ hội. Dạng \"W? + O? → hành động\".",
    suggested_actions: [
      "Mỗi chiến lược nêu rõ mã W và O được ghép.",
    ],
  },

  cp3_strategy_wt: {
    id: "cp3_strategy_wt",
    text: "Chiến lược W-T (phòng tránh): cải thiện điểm yếu nào để tránh bị tổn thương bởi thách thức nào?",
    explanation:
      "Ghép điểm yếu với thách thức để giảm rủi ro lớn nhất. Dạng \"W? + T? → hành động\". " +
      "Nếu nhóm quyết định rút lui khỏi một hướng, nêu rõ lý do.",
    suggested_actions: [
      "Mỗi chiến lược nêu rõ mã W và T được ghép.",
    ],
  },

  // ── Phần 4 — Kết luận ────────────────────────────────────────────────────

  cp3_key_findings: {
    id: "cp3_key_findings",
    text: "Kết luận — Phát hiện chính (Key Findings) của nhóm là gì?",
    explanation:
      "Tóm tắt trong một đoạn: vấn đề khách hàng gặp, vì sao các giải pháp hiện có chưa đủ, " +
      "và kết quả thử nghiệm thực tế chứng minh được điều gì.",
    suggested_actions: [
      "Có ít nhất một kết quả định lượng từ thử nghiệm thực tế.",
    ],
  },

  cp3_business_feasibility: {
    id: "cp3_business_feasibility",
    text: "Kết luận — Tính khả thi kinh doanh (Business Feasibility): vì sao dự án khả thi?",
    explanation:
      "Nêu 2 đến 3 lý do khả thi, mỗi lý do kèm bằng chứng: nhu cầu thị trường, chi phí đầu tư, tín hiệu khách hàng sẵn sàng trả tiền. " +
      "Nêu thêm điều kiện còn cần kiểm chứng để mô hình bền vững.",
    suggested_actions: [
      "Có một điểm hạn chế được nêu thẳng, không chỉ toàn lý do tích cực.",
    ],
  },

  cp3_future_development: {
    id: "cp3_future_development",
    text: "Kết luận — Hướng phát triển (Future Development): kế hoạch ngắn, trung và dài hạn?",
    explanation:
      "Chia ba mốc:\n" +
      "- Ngắn hạn: việc nhóm hoàn thiện ngay sau checkpoint\n" +
      "- Trung hạn: mở rộng tính năng, phân khúc hoặc dịch vụ\n" +
      "- Dài hạn: tầm nhìn sản phẩm\n" +
      "Mỗi mốc gắn với kết quả mong đợi.",
    suggested_actions: [
      "Mốc ngắn hạn có thể thực hiện trong học kỳ này.",
    ],
  },
} satisfies Record<string, Question>;
