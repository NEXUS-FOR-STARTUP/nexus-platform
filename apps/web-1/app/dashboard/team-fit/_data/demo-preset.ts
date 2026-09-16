import type { PresetOption } from "@/components/ui/DemoDataFAB";

export const NEXUS_PRESET = {
  blanks: {
    projectName: "Nexus",
    field: "EdTech - Hỗ trợ khởi nghiệp",
    targetCustomer:
      "team sinh viên FPT học EXE101 gặp khó khăn ở Checkpoint 1 (chưa có idea, idea mơ hồ, hoặc đã rớt CP1)",
    problem:
      "không biết lỗi gốc của ý tưởng nằm ở đâu và không biết sửa phần nào trước — ChatGPT chung chung, bạn bè thiếu nhất quán, giảng viên quá bận",
    solution:
      "dịch vụ audit ý tưởng có cấu trúc: nhận tài liệu, chỉ ra lỗi gốc và thứ tự ưu tiên sửa, re-audit sau mỗi lần team chỉnh sửa — không làm bài hộ, không chọn idea thay",
    mvp: "Concierge MVP (Google Form + Sheet + Zalo + AI prompt nội bộ) — đã test 9 team, điểm CP1 từ ~3.5 lên >=8/10",
  },
  members: [
    {
      major: "Công nghệ phần mềm",
      strengths: [
        "quản lý dự án",
        "full-stack development",
        "thiết kế kiến trúc hệ thống",
        "thiết kế database",
        "AI prompt engineering",
      ],
      experience: [
        "Project Manager & Tech Lead Nexus",
        "xây dựng quy trình audit",
        "trực tiếp hỗ trợ 9 team EXE101",
      ],
    },
    {
      major: "Công nghệ phần mềm",
      strengths: [
        "full-stack development",
        "bảo mật hệ thống",
        "kiểm tra an ninh ứng dụng",
      ],
      experience: [
        "Technical Member Nexus",
        "phát triển hệ thống",
        "phụ trách bảo mật",
      ],
    },
    {
      major: "Truyền thông đa phương tiện",
      strengths: [
        "sáng tạo nội dung",
        "phân tích thị trường",
        "lập kế hoạch marketing",
        "thiết kế Canva",
      ],
      experience: ["Marketing Member Nexus", "phỏng vấn khách hàng EXE101"],
    },
    {
      major: "Truyền thông đa phương tiện",
      strengths: [
        "nghiên cứu thị trường",
        "phân tích customer insight",
        "content marketing",
        "social media",
      ],
      experience: [
        "Marketing Member Nexus",
        "thực hiện 16/25 cuộc phỏng vấn sâu",
      ],
    },
    {
      major: "Truyền thông đa phương tiện",
      strengths: [
        "lập kế hoạch ngân sách",
        "phân tích dữ liệu tài chính",
        "hỗ trợ sales",
        "tổ chức sự kiện",
      ],
      experience: [
        "Finance Member Nexus",
        "xây dựng P&L và dự báo tài chính 10 quý",
      ],
    },
    {
      major: "Công nghệ phần mềm",
      strengths: [
        "thiết kế visual",
        "thiết kế logo banner",
        "Figma",
        "Canva",
        "PowerPoint",
      ],
      experience: [
        "Design Member Nexus",
        "thiết kế visual identity và slide pitch deck",
      ],
    },
  ],
};

export const FARM2DORM_PRESET = {
  blanks: {
    projectName: "Farm2Dorm",
    field: "AgriTech & E-commerce - Phân phối nông sản",
    targetCustomer:
      "sinh viên sống ở ký túc xá FPT cần mua thực phẩm tươi sạch với ngân sách tiết kiệm",
    problem:
      "rau củ mua ở chợ xa campus, siêu thị đắt đỏ, không rõ nguồn gốc, phí giao hàng lẻ đắt hơn tiền rau",
    solution:
      "mô hình gom đơn nông sản sạch trực tiếp từ nông dân Đà Lạt theo từng tòa nhà KTX để tối ưu hóa phí vận chuyển",
    mvp: "Xe gom đơn theo tòa KTX (chốt đơn qua Zalo Group + Google Form) — đã bán thử 200kg rau củ cho sinh viên KTX",
  },
  members: [
    {
      major: "Quản trị kinh doanh",
      strengths: [
        "quản lý chuỗi cung ứng",
        "đàm phán đối tác",
        "nghiên cứu thị trường",
      ],
      experience: [
        "Trưởng nhóm Farm2Dorm",
        "gia đình có 3 hộ nông dân liên kết tại Đà Lạt",
      ],
    },
    {
      major: "Công nghệ phần mềm",
      strengths: [
        "full-stack development",
        "thiết kế giao diện",
        "quản lý dữ liệu đơn hàng",
      ],
      experience: [
        "Phụ trách hệ thống gom đơn",
        "xây dựng landing page giới thiệu sản phẩm",
      ],
    },
    {
      major: "Công nghệ phần mềm",
      strengths: [
        "backend development",
        "tích hợp Zalo Mini App",
        "bảo mật",
      ],
      experience: ["Phát triển bot chốt đơn tự động qua Zalo"],
    },
    {
      major: "Quản trị kinh doanh",
      strengths: [
        "lập kế hoạch tài chính",
        "quản lý chi phí vận chuyển",
        "tính toán điểm hòa vốn",
      ],
      experience: [
        "Phụ trách tài chính",
        "xây dựng bảng giá gom đơn theo khối lượng",
      ],
    },
    {
      major: "Truyền thông đa phương tiện",
      strengths: [
        "sáng tạo nội dung",
        "chụp ảnh sản phẩm",
        "quản lý group cộng đồng",
      ],
      experience: [
        "Phụ trách truyền thông",
        "chạy chiến dịch gom đơn KTX đạt 60 sinh viên",
      ],
    },
  ],
};

export const REWEAR_PRESET = {
  blanks: {
    projectName: "ReWear",
    field: "FashionTech & Circular Economy - Thời trang ký gửi",
    targetCustomer:
      "nữ sinh viên đại học (18-22 tuổi) thích thay đổi phong cách thời trang nhưng ngân sách hạn chế và tủ đồ cũ quá tải",
    problem:
      "quần áo cũ còn mới bị bỏ phí trong tủ, mua đồ hiệu mới đắt đỏ, chưa có nền tảng ký gửi thời trang uy tín cho sinh viên",
    solution:
      "dịch vụ nhận ký gửi, kiểm định chất lượng 5 bước và phân phối đồ secondhand chất lượng cao dành riêng cho sinh viên",
    mvp: "Fanpage ký gửi online + điểm nhận đồ tại phòng trọ — đã kiểm định và bán thành công 90/150 sản phẩm ký gửi",
  },
  members: [
    {
      major: "Truyền thông đa phương tiện",
      strengths: [
        "xây dựng thương hiệu",
        "nội dung livestream",
        "định hình phong cách thời trang",
      ],
      experience: [
        "Founder ReWear",
        "vận hành kênh TikTok thời trang 15k followers",
      ],
    },
    {
      major: "Truyền thông đa phương tiện",
      strengths: [
        "chụp ảnh lookbook",
        "chỉnh sửa video",
        "quản lý kênh Instagram",
      ],
      experience: [
        "Phụ trách hình ảnh sản phẩm",
        "thực hiện 50+ bộ ảnh ký gửi",
      ],
    },
    {
      major: "Truyền thông đa phương tiện",
      strengths: [
        "chăm sóc khách hàng",
        "quản lý livestream bán hàng",
        "bán hàng trực tiếp",
      ],
      experience: [
        "Phụ trách chốt đơn",
        "tổ chức 10 buổi livestream bán đồ secondhand",
      ],
    },
    {
      major: "Truyền thông đa phương tiện",
      strengths: [
        "lập kế hoạch sự kiện",
        "hợp tác với KOLs sinh viên",
        "quản lý quy trình ký gửi",
      ],
      experience: [
        "Phụ trách đối ngoại",
        "kết nối 40 sinh viên tham gia ký gửi đồ",
      ],
    },
  ],
};

export const PAWPAL_PRESET = {
  blanks: {
    projectName: "PawPal",
    field: "PetCare & On-Demand Services - Dịch vụ thú cưng",
    targetCustomer:
      "sinh viên nuôi thú cưng xa nhà cần gửi chăm sóc theo giờ hoặc trông giữ dịp nghỉ lễ/Tết",
    problem:
      "KTX cấm nuôi thú cưng, sinh viên bận học/về quê không ai trông, khách sạn thú cưng truyền thống quá đắt đỏ",
    solution:
      "nền tảng kết nối người nuôi thú cưng với cộng tác viên sinh viên yêu động vật để trông giữ theo giờ với chi phí hợp lý",
    mvp: "Dịch vụ trông pet tại nhà CTV — đã phục vụ 12 khách hàng thường xuyên, doanh thu 4 triệu/tháng",
  },
  members: [
    {
      major: "Công nghệ phần mềm",
      strengths: [
        "quản lý dự án",
        "phát triển ứng dụng di động",
        "thiết kế quy trình dịch vụ",
      ],
      experience: [
        "Trưởng nhóm PawPal",
        "có 3 năm kinh nghiệm nuôi và chăm sóc mèo",
      ],
    },
    {
      major: "Công nghệ phần mềm",
      strengths: [
        "full-stack development",
        "tích hợp bản đồ",
        "hệ thống đặt lịch",
      ],
      experience: ["Phát triển web app đặt lịch trông pet theo giờ"],
    },
    {
      major: "Công nghệ phần mềm",
      strengths: [
        "kiểm thử phần mềm",
        "quản lý cơ sở dữ liệu",
        "bảo mật thông tin",
      ],
      experience: ["Xây dựng cơ sở dữ liệu CTV và lịch trình chăm sóc"],
    },
    {
      major: "Quản trị kinh doanh",
      strengths: [
        "tuyển dụng cộng tác viên",
        "xây dựng quy trình chăm sóc",
        "quản lý rủi ro dịch vụ",
      ],
      experience: ["Tuyển dụng và đào tạo 5 CTV sinh viên chăm sóc thú cưng"],
    },
    {
      major: "Ngôn ngữ Anh",
      strengths: [
        "chăm sóc khách hàng",
        "soạn thảo hợp đồng cam kết",
        "truyền thông cộng đồng",
      ],
      experience: ["Xây dựng bộ quy tắc trách nhiệm và hợp đồng bảo vệ thú cưng"],
    },
  ],
};

export const SMASHBOOK_PRESET = {
  blanks: {
    projectName: "SmashBook",
    field: "SportsTech & Booking Platform - Đặt sân thể thao",
    targetCustomer:
      "sinh viên chơi cầu lông phong trào quanh khu vực Làng Đại học cần tìm sân trống hoặc ghép đội chơi cùng",
    problem:
      "sân cầu lông giờ cao điểm luôn kín lịch, sinh viên đi chơi lẻ khó tìm đủ người ghép sân, chủ sân trống giờ trưa",
    solution:
      "nền tảng đặt sân cầu lông theo thời gian thực tích hợp tính năng ghép đội lẻ và ưu đãi khung giờ vắng",
    mvp: "Web app đặt sân thời gian thực — đã kết nối 4 chủ sân cầu lông, 300 user đăng ký và 80 booking/tháng",
  },
  members: [
    {
      major: "Công nghệ phần mềm",
      strengths: [
        "quản lý hệ thống",
        "thiết kế kiến trúc web",
        "tích hợp cổng thanh toán",
      ],
      experience: [
        "Tech Lead SmashBook",
        "vận hành giải cầu lông sinh viên FPT",
      ],
    },
    {
      major: "Công nghệ phần mềm",
      strengths: [
        "frontend development",
        "React/Next.js",
        "UI/UX sports app",
      ],
      experience: ["Xây dựng giao diện đặt sân và lịch xem thời gian thực"],
    },
    {
      major: "Công nghệ phần mềm",
      strengths: [
        "backend API",
        "thuật toán ghép đội",
        "đặt lịch real-time",
      ],
      experience: [
        "Phát triển thuật toán tìm kiếm và ghép đối thủ theo trình độ",
      ],
    },
    {
      major: "Công nghệ phần mềm",
      strengths: [
        "mobile optimization",
        "kiểm thử tự động",
        "tối ưu hiệu năng",
      ],
      experience: ["Tối ưu trải nghiệm đặt sân trên thiết bị di động"],
    },
    {
      major: "Quản trị kinh doanh",
      strengths: [
        "phát triển thị trường",
        "đàm phán với chủ sân",
        "xây dựng mô hình hoa hồng",
      ],
      experience: ["Liên kết thành công 4 sân cầu lông lớn quanh Làng Đại học"],
    },
    {
      major: "Quản trị kinh doanh",
      strengths: [
        "marketing thể thao",
        "tổ chức sự kiện giao lưu",
        "quản lý cộng đồng player",
      ],
      experience: ["Phụ trách phát triển cộng đồng 300 người chơi cầu lông"],
    },
  ],
};

export const LEANTEA_PRESET = {
  blanks: {
    projectName: "LeanTea",
    field: "Food & Beverage (F&B) - Đồ uống Healthy",
    targetCustomer:
      "sinh viên tập gym, người theo chế độ eat-clean và nữ giới quan tâm đến sức khỏe tại các trường đại học",
    problem:
      "trà sữa truyền thống chứa quá nhiều đường và calo rỗng, trong khi đồ uống healthy cao cấp lại quá đắt đỏ",
    solution:
      "dòng trà sữa healthy sử dụng đường ăn kiêng, sữa hạt và topping yến mạch với mức giá hợp lý cho sinh viên",
    mvp: "Xe đẩy trà sữa healthy trước cổng trường — vận hành 3 tháng, bán trung bình 80 ly/ngày với 200 khách quen",
  },
  members: [
    {
      major: "Quản trị kinh doanh",
      strengths: [
        "quản lý vận hành F&B",
        "nghiên cứu công thức đồ uống",
        "quản lý chất lượng",
      ],
      experience: ["Chủ quán LeanTea", "có chứng chỉ pha chế chuyên nghiệp"],
    },
    {
      major: "Quản trị kinh doanh",
      strengths: [
        "lập kế hoạch tài chính",
        "quản lý chi phí nguyên liệu",
        "định giá sản phẩm",
      ],
      experience: [
        "Phụ trách tài chính",
        "xây dựng công thức tính PnL cho từng ly trà sữa",
      ],
    },
    {
      major: "Quản trị kinh doanh",
      strengths: [
        "marketing tại điểm bán",
        "quản lý nhóm khách hàng thân thiết",
        "chạy khuyến mãi",
      ],
      experience: [
        "Xây dựng và chăm sóc group Zalo 200 khách hàng thân thiết",
      ],
    },
    {
      major: "Quản trị kinh doanh",
      strengths: [
        "tìm kiếm nguồn cung ứng",
        "đàm phán giá nguyên liệu healthy",
        "quản lý tồn kho",
      ],
      experience: [
        "Liên kết 2 nhà cung cấp đường ăn kiêng và sữa hạt giá sỉ",
      ],
    },
  ],
};

export const MENTORMAP_PRESET = {
  blanks: {
    projectName: "MentorMap",
    field: "EdTech & Peer-to-Peer Learning - Học tập cộng đồng",
    targetCustomer:
      "tân sinh viên năm nhất gặp khó khăn với các môn đại cương (Toán rời rạc, Lập trình C, Tiếng Anh)",
    problem:
      "sinh viên năm nhất dễ rớt môn đại cương, trung tâm gia sư ngoài quá đắt, học cùng bạn bè thiếu định hướng",
    solution:
      "nền tảng kết nối 1-1 giữa sinh viên năm nhất và anh chị khóa trên điểm A/A+ để kèm học theo buổi",
    mvp: "Hệ thống kết nối mentor 1-1 online — đã thu hút 40 mentor khóa trên và tổ chức các buổi kèm thử nghiệm",
  },
  members: [
    {
      major: "Công nghệ phần mềm",
      strengths: [
        "quản lý dự án",
        "xây dựng nền tảng học tập",
        "phân tích yêu cầu",
      ],
      experience: [
        "Trưởng nhóm MentorMap",
        "cựu Trưởng ban Học thuật CLB Lập trình",
      ],
    },
    {
      major: "Công nghệ phần mềm",
      strengths: [
        "full-stack web development",
        "tích hợp Zoom/Google Meet API",
        "hệ thống đánh giá",
      ],
      experience: [
        "Phát triển web app đặt lịch học và tự động tạo phòng học",
      ],
    },
    {
      major: "Quản trị kinh doanh",
      strengths: [
        "tuyển dụng mentor",
        "kiểm định chất lượng học thuật",
        "quản lý vận hành",
      ],
      experience: [
        "Kiểm định hồ sơ và phỏng vấn tuyển chọn 40 mentor điểm A+",
      ],
    },
    {
      major: "Sư phạm tiếng Anh",
      strengths: [
        "thiết kế phương pháp giảng dạy",
        "soạn thảo bộ tiêu chuẩn mentor",
        "đánh giá đầu ra",
      ],
      experience: ["Xây dựng khung đánh giá chất lượng buổi kèm 90 phút"],
    },
    {
      major: "Sư phạm tiếng Anh",
      strengths: [
        "chăm sóc sinh viên",
        "quản lý phản hồi học viên",
        "truyền thông học thuật",
      ],
      experience: [
        "Phụ trách hỗ trợ tân sinh viên và giải quyết khiếu nại buổi học",
      ],
    },
  ],
};

export const SHARENEST_PRESET = {
  blanks: {
    projectName: "ShareNest",
    field: "PropTech & Social Matching - Tìm bạn ở ghép",
    targetCustomer:
      "tân sinh viên tỉnh lẻ mới lên thành phố nhập học cần tìm bạn ở ghép hợp tính cách và sinh hoạt",
    problem:
      "ở ghép với người lạ dễ phát sinh mâu thuẫn thói quen (giờ giấc, vệ sinh, tài chính), rủi ro quỵt tiền nhà",
    solution:
      "nền tảng ghép phòng trọ thông qua thuật toán đánh giá mức độ tương thích thói quen và hợp đồng mẫu",
    mvp: "Hệ thống ghép phòng qua test thói quen (Google Form + Matching sheet) — đã ghép thành công 15 phòng trọ",
  },
  members: [
    {
      major: "Luật kinh tế",
      strengths: [
        "soạn thảo hợp đồng ở ghép",
        "tư vấn pháp lý trọ",
        "xử lý tranh chấp",
      ],
      experience: [
        "Trưởng nhóm ShareNest",
        "xây dựng bộ hợp đồng mẫu ở ghép sinh viên",
      ],
    },
    {
      major: "Luật kinh tế",
      strengths: [
        "thẩm định pháp lý nhà trọ",
        "quy định an ninh trật tự",
        "tư vấn quyền lợi sinh viên",
      ],
      experience: [
        "Khảo sát pháp lý và pháp lý phòng trọ khu vực quanh campus",
      ],
    },
    {
      major: "Quản trị kinh doanh",
      strengths: [
        "phân tích tâm lý thói quen",
        "xây dựng bộ câu hỏi matching",
        "quản lý khách hàng",
      ],
      experience: [
        "Thiết kế bài test 20 câu hỏi về thói quen sinh hoạt sinh viên",
      ],
    },
    {
      major: "Quản trị kinh doanh",
      strengths: [
        "khảo sát nguồn phòng trọ",
        "đàm phán với chủ trọ",
        "marketing sinh viên",
      ],
      experience: ["Liên kết 30 chủ nhà trọ uy tín quanh campus Hòa Lạc"],
    },
  ],
};

export const CHARGECAMPUS_PRESET = {
  blanks: {
    projectName: "ChargeCampus",
    field: "CleanTech & Energy Mobility - Hạ tầng sạc xe điện",
    targetCustomer:
      "sinh viên và cán bộ giảng viên di chuyển bằng xe máy điện trong khuôn viên trường đại học",
    problem:
      "số lượng xe máy điện tăng nhanh nhưng campus thiếu trạm sạc an toàn, nguy cơ cháy nổ từ ổ cắm tự phát",
    solution:
      "mạng lưới trạm sạc xe máy điện thông minh đặt tại bãi xe trường, quản lý và thanh toán qua QR code",
    mvp: "2 trụ sạc thử nghiệm tại bãi xe campus — phục vụ trung bình 30 lượt sạc/ngày với sự cho phép của nhà trường",
  },
  members: [
    {
      major: "Kỹ thuật điện",
      strengths: [
        "thiết kế phần cứng trụ sạc",
        "an toàn điện & phòng cháy",
        "quản lý công suất sạc",
      ],
      experience: [
        "Trưởng nhóm ChargeCampus",
        "nghiên cứu đề tài sạc xe điện cấp trường",
      ],
    },
    {
      major: "Kỹ thuật điện",
      strengths: [
        "lắp đặt hệ thống điện",
        "kiểm định thiết bị đo lường",
        "bảo trì trụ sạc",
      ],
      experience: ["Trực tiếp chế tạo và lắp đặt 2 trụ sạc thử nghiệm"],
    },
    {
      major: "Kỹ thuật điện",
      strengths: [
        "mạch điều khiển IoT",
        "cảm biến nhiệt độ an toàn",
        "giao tiếp phần cứng",
      ],
      experience: ["Phát triển mạch ngắt tự động khi quá nhiệt hoặc sạc đầy"],
    },
    {
      major: "Công nghệ phần mềm",
      strengths: [
        "lập trình nhúng IoT",
        "phát triển app quét QR sạc",
        "tích hợp ví điện tử",
      ],
      experience: [
        "Xây dựng phần mềm điều khiển trụ sạc và thanh toán tự động",
      ],
    },
    {
      major: "Công nghệ phần mềm",
      strengths: [
        "cloud backend",
        "quản lý dữ liệu tiêu thụ điện",
        "dashboard giám sát",
      ],
      experience: [
        "Phát triển hệ thống theo dõi điện năng tiêu thụ theo thời gian thực",
      ],
    },
    {
      major: "Quản trị kinh doanh",
      strengths: [
        "xây dựng mô hình tài chính",
        "tính toán chi phí khấu hao",
        "làm việc với nhà trường",
      ],
      experience: [
        "Xin cấp phép thử nghiệm thành công với Ban Quản trị Campus",
      ],
    },
  ],
};

export const MINDNOTE_PRESET = {
  blanks: {
    projectName: "MindNote",
    field: "HealthTech & Mental Wellness - Sức khỏe tinh thần",
    targetCustomer:
      "sinh viên đại học gặp áp lực học tập, stress mùa thi hoặc rối loạn cảm xúc nhẹ cần nơi chia sẻ",
    problem:
      "sinh viên ngại đi khám tâm lý vì chi phí đắt và rào cản tâm lý, thiếu công cụ theo dõi cảm xúc hàng ngày",
    solution:
      "ứng dụng nhật ký tâm trạng thông minh kết hợp trợ lý AI lắng nghe và các bài tập giải tỏa căng thẳng",
    mvp: "App nhật ký di động trên App Store / Google Play — đạt 500 lượt tải và 60 người dùng hoạt động hàng tuần",
  },
  members: [
    {
      major: "Công nghệ phần mềm",
      strengths: [
        "quản lý dự án mobile",
        "lập trình Flutter",
        "tích hợp AI LLM",
      ],
      experience: [
        "Trưởng nhóm MindNote",
        "đã phát triển 2 ứng dụng di động công cộng",
      ],
    },
    {
      major: "Công nghệ phần mềm",
      strengths: [
        "frontend Flutter",
        "UI/UX mượt mà",
        "thiết kế animation thư giãn",
      ],
      experience: [
        "Phụ trách thiết kế và lập trình giao diện người dùng ứng dụng",
      ],
    },
    {
      major: "Công nghệ phần mềm",
      strengths: [
        "backend Node.js",
        "bảo mật dữ liệu cá nhân",
        "mã hóa nhật ký",
      ],
      experience: [
        "Xây dựng hệ thống bảo mật mã hóa đầu-cuối cho nhật ký người dùng",
      ],
    },
    {
      major: "Thiết kế đồ họa",
      strengths: [
        "thiết kế UI/UX",
        "bộ nhận diện thương hiệu nhẹ nhàng",
        "minh họa nhân vật AI",
      ],
      experience: [
        "Thiết kế mascot AI trợ lý lắng nghe và giao diện gamification",
      ],
    },
    {
      major: "Tâm lý học",
      strengths: [
        "xây dựng kịch bản lắng nghe",
        "phương pháp trị liệu CBT",
        "kiểm duyệt an toàn nội dung",
      ],
      experience: [
        "Soạn thảo bộ câu hỏi gợi mở cảm xúc và các bài tập thở khoa học",
      ],
    },
  ],
};

export const CRAFTUNI_PRESET = {
  blanks: {
    projectName: "CraftUni",
    field: "E-Commerce & Handmade Marketplace - Chợ đồ thủ công",
    targetCustomer:
      "sinh viên khéo tay làm đồ handmade và khách hàng yêu thích quà tặng độc bản",
    problem:
      "sinh viên tự làm đồ handmade khó tiếp cận khách hàng lớn, hình ảnh tự chụp kém thu hút, phí ship lẻ cao",
    solution:
      "sàn thương mại điện tử tập trung cho sản phẩm handmade sinh viên hỗ trợ chụp ảnh studio và gom đơn giao hàng",
    mvp: "Chợ handmade online + 2 đợt hội chợ offline — quy tụ 25 gian hàng sinh viên với GMV 15 triệu/tháng",
  },
  members: [
    {
      major: "Quản trị kinh doanh",
      strengths: [
        "quản lý sàn thương mại",
        "tổ chức sự kiện hội chợ",
        "phát triển người bán",
      ],
      experience: [
        "Trưởng nhóm CraftUni",
        "tổ chức thành công 2 hội chợ handmade sinh viên",
      ],
    },
    {
      major: "Quản trị kinh doanh",
      strengths: [
        "xây dựng chính sách hoa hồng",
        "quản lý vận hành đơn hàng",
        "chăm sóc gian hàng",
      ],
      experience: [
        "Phụ trách hỗ trợ 25 gian hàng sinh viên tối ưu quy trình bán",
      ],
    },
    {
      major: "Thiết kế đồ họa",
      strengths: [
        "chụp ảnh sản phẩm studio",
        "styling hình ảnh handmade",
        "thiết kế banner",
      ],
      experience: [
        "Xây dựng phong cách hình ảnh chuẩn cho các gian hàng trên sàn",
      ],
    },
    {
      major: "Thiết kế đồ họa",
      strengths: [
        "thiết kế thương hiệu",
        "quản lý kênh truyền thông",
        "thiết kế bao bì quà tặng",
      ],
      experience: [
        "Phụ trách thiết kế bộ nhận diện thương hiệu và bao bì sản phẩm",
      ],
    },
  ],
};

export const DEMO_PRESETS: PresetOption[] = [
  {
    label: "Nexus - Nhóm 13 EXE101",
    description: "Dịch vụ audit idea khởi nghiệp cho sinh viên FPT",
    data: NEXUS_PRESET,
  },
  {
    label: "Farm2Dorm - Nhóm 07",
    description: "Nông sản Đà Lạt gom đơn theo ký túc xá",
    data: FARM2DORM_PRESET,
  },
  {
    label: "ReWear - Nhóm 21",
    description: "Tủ đồ secondhand ký gửi cho sinh viên",
    data: REWEAR_PRESET,
  },
  {
    label: "PawPal - Nhóm 04",
    description: "Trông thú cưng theo giờ ngày lễ",
    data: PAWPAL_PRESET,
  },
  {
    label: "SmashBook - Nhóm 11",
    description: "Đặt sân cầu lông kèm ghép đội lẻ",
    data: SMASHBOOK_PRESET,
  },
  {
    label: "LeanTea - Nhóm 16",
    description: "Trà sữa healthy cho sinh viên gym",
    data: LEANTEA_PRESET,
  },
  {
    label: "MentorMap - Nhóm 09",
    description: "Kết nối tân sinh viên với mentor khóa trên",
    data: MENTORMAP_PRESET,
  },
  {
    label: "ShareNest - Nhóm 25",
    description: "Ghép phòng trọ theo tính cách",
    data: SHARENEST_PRESET,
  },
  {
    label: "ChargeCampus - Nhóm 02",
    description: "Trạm sạc xe điện trong campus",
    data: CHARGECAMPUS_PRESET,
  },
  {
    label: "MindNote - Nhóm 18",
    description: "Nhật ký tâm trạng kèm AI an ủi",
    data: MINDNOTE_PRESET,
  },
  {
    label: "CraftUni - Nhóm 29",
    description: "Chợ đồ handmade sinh viên",
    data: CRAFTUNI_PRESET,
  },
];
