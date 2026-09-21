"use client";

import type { IntakeData } from "../_types/intake.types";
import type { PresetOption } from "@/components/ui/DemoDataFAB";

const NEXUS_INTAKE_PRESET: IntakeData = {
  package_id: "",
  current_blocker:
    "Nhóm đã hoàn thành 4 CP với điểm tốt nhưng chưa có doanh thu thật từ 9 team đã hỗ trợ (đều miễn phí do GV chuyển đến). Cần kiểm chứng willingness-to-pay và chuyển từ Concierge MVP sang Web App MVP. Cạnh tranh với ChatGPT/Gemini đang ngày càng mạnh.",
  current_situations: [
    "Đã test MVP với khách hàng thật (9 team)",
    "Đã phỏng vấn khách hàng (25 người)",
    "Đã có quy trình audit + template + checklist",
    "Đang xây web app (Next.js + Hono + Prisma)",
    "Đã có Lean Canvas + SWOT + kế hoạch tài chính 10 quý",
    "Chưa có doanh thu",
  ],
  case_summary:
    "Nexus là dịch vụ đánh giá và phản biện ý tưởng khởi nghiệp cho sinh viên. Giúp nhóm nhận diện lỗi logic, giả định thiếu căn cứ và hướng hoàn thiện tài liệu dự án trước khi bảo vệ.",
  contact: {
    full_name: "Phùng Lưu Hoàng Long",
    student_code: "SE190377",
    team_role: "Project Manager & Tech Lead",
    zalo: "",
    email: "",
    telegram: "",
  },
  team_context: {
    group_no: "13",
    project_name: "Nexus",
    team_status_summary:
      "Nhóm 6 người (3 CNPM + 3 Truyền thông ĐPT). Đang hoàn thiện sản phẩm công nghệ hỗ trợ sinh viên khởi nghiệp.",
  },
  support_needs: {
    primary_need: "critique_feasibility",
    extra_notes:
      "Mô hình 3 gói 149K-599K có khả thi khi chưa có doanh thu thật? Team có đủ năng lực scale không? Cần thêm vai trò gì khi mở rộng?",
  },
  documents: [],
  lecturer_feedback:
    'CP2: "Làm web app hẳn hoi, không chỉ Google Form + Sheet". CP3: "Đừng phụ thuộc rubric — xây tiêu chí đánh giá riêng". CP4: "Không oversell — Nexus hỗ trợ, không cam kết điểm".',
  expected_outputs:
    "Báo cáo team-fit: điểm mạnh/yếu, gaps, rủi ro, vai trò cần bổ sung.",
  boundary_confirmations: ["originality", "advisory_only", "accurate_contact"],
  school: "Đại học FPT",
  course_context: "EXE101",
};

const FARM2DORM_PRESET: IntakeData = {
  package_id: "",
  current_blocker:
    "Đã kết nối được 3 hộ nông dân Đà Lạt và bán thử 200kg rau qua Zalo, nhưng chi phí giao hàng lên TP.HCM ăn hết biên lợi nhuận. Chưa biết nên tăng giá, gom đơn theo ký túc xá hay tìm đối tác vận chuyển.",
  current_situations: [
    "Đã bán thử 200kg rau củ qua Zalo cá nhân",
    "Có 3 hộ nông dân cam kết nguồn hàng ổn định",
    "Đã khảo sát 60 sinh viên ký túc xá về nhu cầu",
    "Chưa có website/app, chốt đơn thủ công",
  ],
  case_summary:
    "Farm2Dorm là kênh phân phối nông sản Đà Lạt trực tiếp tới sinh viên ở ký túc xá, gom đơn theo tòa nhà để giảm phí ship. Khách hàng: sinh viên FPT ở KTX. Pain: rau siêu thị đắt, chợ xa, không rõ nguồn gốc. Mô hình: gom đơn tối thiểu 20kg/tòa, giao 2 chuyến/tuần, margin 25%.",
  contact: {
    full_name: "Nguyễn Thị Mai Anh",
    student_code: "SE184522",
    team_role: "Trưởng nhóm",
    zalo: "",
    email: "",
    telegram: "",
  },
  team_context: {
    group_no: "07",
    project_name: "Farm2Dorm",
    team_status_summary:
      "Nhóm 5 người (2 CNPM + 2 QTKD + 1 Thiết kế). Đang học EXE101 kỳ Fall 2026, đã qua CP1 với điểm 7.5. Có 1 thành viên nhà ở Đà Lạt, quen trực tiếp hộ nông dân.",
  },
  support_needs: {
    primary_need: "critique_feasibility",
    extra_notes:
      "Mô hình gom đơn theo tòa KTX có khả thi về chi phí không? Nên ưu tiên giảm phí ship hay tăng giá trị đơn hàng trước?",
  },
  documents: [],
  lecturer_feedback:
    'CP1: "Ý tưởng tốt nhưng số liệu chi phí còn ước đoán. Cần bảng tính chi tiết phí vận chuyển Đà Lạt - TP.HCM theo từng mức sản lượng".',
  expected_outputs:
    "Báo cáo phản biện: mô hình gom đơn có khả thi không, điểm hòa vốn ở sản lượng nào, 3 việc cần làm ngay.",
  boundary_confirmations: ["originality", "advisory_only", "accurate_contact"],
  school: "Đại học FPT",
  course_context: "EXE101",
};

const REWEAR_PRESET: IntakeData = {
  package_id: "",
  current_blocker:
    "Tủ đồ secondhand online đã có 150 món ký gửi từ sinh viên nhưng tồn kho quay chậm, 40% hàng quá 30 ngày chưa bán được. Phân vân giữa giảm hoa hồng để hút người mua hay siết tiêu chuẩn nhận ký gửi.",
  current_situations: [
    "Đang vận hành fanpage với 150 món ký gửi",
    "Đã bán được 90 món trong 2 tháng",
    "Có quy trình kiểm tra chất lượng 5 bước",
    "Chưa có kho riêng, để hàng ở phòng trọ thành viên",
  ],
  case_summary:
    "ReWear là tủ đồ secondhand ký gửi cho sinh viên: nhận đồ cũ còn tốt, chụp ảnh, bán hộ ăn hoa hồng 30%. Khách hàng: nữ sinh viên 18-22. Pain: tủ đồ chật, đồ cũ bỏ phí, mua đồ mới tốn kém. Đã có dòng tiền nhỏ nhưng tồn kho chậm.",
  contact: {
    full_name: "Trần Lê Bảo Ngọc",
    student_code: "SS181034",
    team_role: "Founder",
    zalo: "",
    email: "",
    telegram: "",
  },
  team_context: {
    group_no: "21",
    project_name: "ReWear",
    team_status_summary:
      "Nhóm 4 người toàn ngành Truyền thông đa phương tiện. Mạnh content/livestream bán hàng, yếu tài chính và vận hành kho. Đang học EXE101 kỳ Summer 2026.",
  },
  support_needs: {
    primary_need: "clarify_customer_pain",
    extra_notes:
      "Người mua thực sự cần gì: giá rẻ, đồ độc, hay yếu tố bền vững? Tồn kho chậm do sai khách hàng hay sai định giá?",
  },
  documents: [],
  lecturer_feedback:
    'CP2: "Hoa hồng 30% lấy từ đâu ra? So sánh với các shop 2hand hiện tại. Tồn kho 40% quá 30 ngày là tín hiệu xấu, phải xử lý".',
  expected_outputs:
    "Báo cáo phản biện: chân dung người mua thực, chính sách giá và xử lý tồn kho, có nên mở kho riêng không.",
  boundary_confirmations: ["originality", "advisory_only", "accurate_contact"],
  school: "Đại học FPT",
  course_context: "EXE101",
};

const PAWPAL_PRESET: IntakeData = {
  package_id: "",
  current_blocker:
    "Dịch vụ trông pet theo giờ cho sinh viên đã có 12 khách quen nhưng toàn bộ đặt lịch qua tin nhắn, hay bị trùng giờ và quên lịch. Muốn làm app đặt lịch nhưng sợ chi phí dev vượt quá doanh thu hiện tại (~4 triệu/tháng).",
  current_situations: [
    "Đang phục vụ 12 khách quen, doanh thu ~4 triệu/tháng",
    "Có 5 cộng tác viên sinh viên yêu động vật",
    "Đã xảy ra 2 vụ trùng lịch trong tháng qua",
    "Chưa có hợp đồng trách nhiệm khi pet ốm/mất",
  ],
  case_summary:
    "PawPal là dịch vụ trông thú cưng theo giờ cho sinh viên xa nhà về quê dịp lễ: tắm, dắt đi dạo, gửi qua đêm. Giá 50K/giờ, 200K/đêm. Pain: ký túc xá cấm nuôi pet, ngày lễ không ai trông. Rủi ro pháp lý và trách nhiệm chưa được xử lý.",
  contact: {
    full_name: "Lê Hoàng Phúc",
    student_code: "SE187711",
    team_role: "Trưởng nhóm",
    zalo: "",
    email: "",
    telegram: "",
  },
  team_context: {
    group_no: "04",
    project_name: "PawPal",
    team_status_summary:
      "Nhóm 5 người (3 CNPM + 1 QTKD + 1 Ngôn ngữ Anh). 2 thành viên đang nuôi chó mèo, có kinh nghiệm thực tế. Đang học EXE101 kỳ Fall 2026.",
  },
  support_needs: {
    primary_need: "filter_select_idea",
    extra_notes:
      "Nên tập trung vào đặt lịch online, gói gửi dài ngày dịp Tết, hay mở rộng sang spa thú cưng? Nguồn lực chỉ đủ làm 1 hướng.",
  },
  documents: [],
  lecturer_feedback:
    'CP1: "Rủi ro khi pet ốm hoặc mất thì ai chịu? Chưa thấy điều khoản trách nhiệm. Doanh thu 4 triệu có đủ trả công 5 cộng tác viên không?".',
  expected_outputs:
    "Báo cáo phản biện: hướng đi ưu tiên, khung trách nhiệm/rủi ro cần có, có nên làm app ngay hay dùng form đặt lịch trước.",
  boundary_confirmations: ["originality", "advisory_only", "accurate_contact"],
  school: "Đại học FPT",
  course_context: "EXE101",
};

const SMASHBOOK_PRESET: IntakeData = {
  package_id: "",
  current_blocker:
    "Web đặt sân cầu lông quanh Làng Đại học đã liên kết 4 sân, nhưng khung giờ đẹp (17h-20h) luôn kín còn giờ trưa bỏ trống 70%. Chủ sân đòi phí duy trì listing dù không có booking từ nền tảng.",
  current_situations: [
    "Đã liên kết 4 sân cầu lông quanh campus",
    "Có 300 user đăng ký, 80 booking/tháng",
    "Giờ trưa trống 70%, giờ cao điểm quá tải",
    "Thu phí 10% mỗi booking thành công",
  ],
  case_summary:
    "SmashBook là nền tảng đặt sân cầu lông theo giờ kèm ghép đội lẻ: sinh viên thiếu người có thể join trận có sẵn. Doanh thu từ hoa hồng 10%/booking. Vấn đề: mất cân đối cung cầu theo khung giờ, chủ sân chưa thấy giá trị.",
  contact: {
    full_name: "Phạm Quốc Huy",
    student_code: "SE183908",
    team_role: "Tech Lead",
    zalo: "",
    email: "",
    telegram: "",
  },
  team_context: {
    group_no: "11",
    project_name: "SmashBook",
    team_status_summary:
      "Nhóm 6 người (4 CNPM + 2 QTKD). Web app đã chạy demo, tích hợp thanh toán thử nghiệm. Thành viên đều chơi cầu lông phong trào. EXE101 Summer 2026.",
  },
  support_needs: {
    primary_need: "critique_feasibility",
    extra_notes:
      "Chính sách giá theo khung giờ có giải được bài toán trống giờ trưa không? Có nên thu phí listing của chủ sân hay chỉ ăn hoa hồng?",
  },
  documents: [],
  lecturer_feedback:
    'CP3: "80 booking/tháng với 300 user là tỷ lệ dùng lại thấp. Vì sao người ta đặt 1 lần rồi thôi? Tính năng ghép đội có ai dùng thật không?".',
  expected_outputs:
    "Báo cáo phản biện: nguyên nhân retention thấp, cơ chế giá động theo khung giờ, đề xuất giữ chân chủ sân.",
  boundary_confirmations: ["originality", "advisory_only", "accurate_contact"],
  school: "Đại học FPT",
  course_context: "EXE101",
};

const LEANTEA_PRESET: IntakeData = {
  package_id: "",
  current_blocker:
    "Quán trà sữa ít đường cho sinh viên gym đã mở xe đẩy trước cổng trường được 3 tháng, doanh thu ổn định nhưng chưa đủ để thuê mặt bằng cố định. Nguyên liệu healthy (đường ăn kiêng, sữa hạt) đắt gấp đôi, giá bán khó cạnh tranh với trà sữa 25K.",
  current_situations: [
    "Xe đẩy hoạt động 3 tháng, ~80 ly/ngày",
    "Có 200 khách hàng thân thiết trong group Zalo",
    "Chi phí nguyên liệu healthy cao gấp đôi trà sữa thường",
    "Chưa đăng ký VSATTP và giấy phép kinh doanh",
  ],
  case_summary:
    "LeanTea là trà sữa healthy (ít đường, sữa hạt, topping yến mạch) giá 35-45K nhắm vào sinh viên tập gym và nữ giới ăn kiêng. Pain: trà sữa thường nhiều đường, đồ healthy thì đắt và khó mua. Thách thức: giá cao + pháp lý thực phẩm.",
  contact: {
    full_name: "Đặng Thu Thảo",
    student_code: "SB186620",
    team_role: "Chủ quán",
    zalo: "",
    email: "",
    telegram: "",
  },
  team_context: {
    group_no: "16",
    project_name: "LeanTea",
    team_status_summary:
      "Nhóm 4 người ngành Quản trị kinh doanh, 1 thành viên có chứng chỉ pha chế. Mạnh bán hàng offline, yếu pháp lý và quản trị chi phí. EXE101 Fall 2026.",
  },
  support_needs: {
    primary_need: "improve_rejected_idea",
    extra_notes:
      "Giảng viên cho rằng giá 40K không cạnh tranh nổi với trà sữa 25K. Làm sao chứng minh phân khúc healthy chịu chi? Có nên thu hẹp menu để giảm tồn kho?",
  },
  documents: [],
  lecturer_feedback:
    'CP2: "Giá 40K/ly cho sinh viên là rào cản lớn. Chưa thấy giấy VSATTP mà đã bán 3 tháng là rủi ro pháp lý. Tính lại điểm hòa vốn với giá nguyên liệu hiện tại".',
  expected_outputs:
    "Báo cáo phản biện: phân khúc khách hàng chịu chi thực sự, menu tối ưu, lộ trình pháp lý và điểm hòa vốn xe đẩy vs mặt bằng.",
  boundary_confirmations: ["originality", "advisory_only", "accurate_contact"],
  school: "Đại học FPT",
  course_context: "EXE101",
};

const MENTORMAP_PRESET: IntakeData = {
  package_id: "",
  current_blocker:
    "Nền tảng kết nối sinh viên năm nhất với mentor khóa trên đã có 40 mentor đăng ký nhưng chỉ 8 buổi học diễn ra trong tháng đầu. Học viên đăng ký rồi không đến, mentor nản và ngừng nhận lịch.",
  current_situations: [
    "40 mentor đăng ký, phủ 6 môn đại cương",
    "Chỉ 8 buổi học thành công trong tháng đầu",
    "Tỷ lệ no-show của học viên ~60%",
    "Giá 80K/buổi, mentor nhận 70%",
  ],
  case_summary:
    "MentorMap kết nối tân sinh viên cần kèm môn đại cương với anh chị khóa trên điểm cao. Học 1-1 online 90 phút, 80K/buổi. Pain: tân sinh viên rớt môn, trung tâm gia sư đắt và xa. Vấn đề: no-show cao, chất lượng mentor không đồng đều.",
  contact: {
    full_name: "Võ Thành Đạt",
    student_code: "SE182245",
    team_role: "Trưởng nhóm",
    zalo: "",
    email: "",
    telegram: "",
  },
  team_context: {
    group_no: "09",
    project_name: "MentorMap",
    team_status_summary:
      "Nhóm 5 người (2 CNPM + 1 QTKD + 2 Sư phạm tiếng Anh). Có mạng lưới mentor từ CLB học thuật. Đang học EXE101 Summer 2026, đã qua CP2 điểm 8.",
  },
  support_needs: {
    primary_need: "clarify_customer_pain",
    extra_notes:
      "No-show 60% vì học viên không thực sự cần, vì giá cao, hay vì đặt lịch quá dễ dàng? Có nên thu cọc trước buổi học?",
  },
  documents: [],
  lecturer_feedback:
    'CP2: "Chênh lệch giữa 40 mentor và 8 buổi học là red flag. Vấn đề ở cầu hay ở cung? Cơ chế đảm bảo mentor dạy tốt là gì?".',
  expected_outputs:
    "Báo cáo phản biện: nguyên nhân no-show, cơ chế cọc và đánh giá mentor, có nên chuyển sang gói theo tháng thay vì lẻ từng buổi.",
  boundary_confirmations: ["originality", "advisory_only", "accurate_contact"],
  school: "Đại học FPT",
  course_context: "EXE101",
};

const SHARENEST_PRESET: IntakeData = {
  package_id: "",
  current_blocker:
    "Nhóm ghép phòng trọ cho tân sinh viên đã ghép thành công 15 phòng nhưng 3 vụ mâu thuẫn bạn cùng phòng khiến phải đổi người giữa chừng. Chưa có bộ tiêu chí ghép và hợp đồng rõ ràng nên xử lý tranh chấp rất tốn thời gian.",
  current_situations: [
    "Đã ghép thành công 15 phòng trọ",
    "3 vụ mâu thuẫn phải đổi người",
    "Thu phí dịch vụ 300K/phòng ghép thành công",
    "Chưa có tiêu chí ghép và hợp đồng mẫu",
  ],
  case_summary:
    "ShareNest giúp tân sinh viên tìm bạn cùng phòng hợp tính cách qua bài test thói quen sinh hoạt (giờ giấc, hút thuốc, nuôi pet), rồi giới thiệu phòng trọ phù hợp quanh campus. Pain: tân sinh viên lạ thành phố, sợ ở ghép với người không hợp. Rủi ro: tranh chấp và trách nhiệm pháp lý khi có sự cố.",
  contact: {
    full_name: "Hoàng Ngọc Linh",
    student_code: "SS185517",
    team_role: "Trưởng nhóm",
    zalo: "",
    email: "",
    telegram: "",
  },
  team_context: {
    group_no: "25",
    project_name: "ShareNest",
    team_status_summary:
      "Nhóm 4 người (2 Luật kinh tế + 2 QTKD) tại campus Hòa Lạc (Hà Nội). Mạnh pháp lý và tư vấn, yếu công nghệ (mới chỉ dùng Google Form + Sheet). EXE101 Fall 2026.",
  },
  support_needs: {
    primary_need: "audit_cp1_draft",
    extra_notes:
      "Rà soát giúp báo cáo CP1, đặc biệt phần phân tích rủi ro tranh chấp và mô hình thu phí 300K có bền vững khi quy mô tăng.",
  },
  documents: [],
  lecturer_feedback:
    'CP1: "Bài test tính cách tự chế chưa có cơ sở khoa học. 3/15 vụ mâu thuẫn là tỷ lệ cao. Ai chịu trách nhiệm khi bạn cùng phòng quỵt tiền nhà?".',
  expected_outputs:
    "Báo cáo rà CP1: lỗ hổng phân tích rủi ro, khung hợp đồng tối thiểu, mô hình phí bền vững khi scale.",
  boundary_confirmations: ["originality", "advisory_only", "accurate_contact"],
  school: "Đại học FPT",
  course_context: "EXE101",
};

const CHARGECAMPUS_PRESET: IntakeData = {
  package_id: "",
  current_blocker:
    "Trạm sạc xe điện trong campus mới lắp 2 trụ sạc thử nghiệm, nhưng giờ cao điểm xếp hàng dài còn ban ngày vắng. Chưa tính được giá sạc bao nhiêu thì hòa vốn tiền điện + khấu hao trụ trong 2 năm.",
  current_situations: [
    "2 trụ sạc thử nghiệm trong bãi xe trường",
    "~30 lượt sạc/ngày, tập trung 17h-19h",
    "Giá điện kinh doanh + khấu hao trụ chưa tính kỹ",
    "Đã xin phép thử nghiệm từ phòng quản trị campus",
  ],
  case_summary:
    "ChargeCampus đặt trụ sạc xe máy điện trong trường học, thu phí theo kWh + phí giữ chỗ quá giờ. Khách hàng: sinh viên đi xe điện (ngày càng nhiều sau lệnh hạn chế xe xăng). Pain: hết pin giữa ngày, không có chỗ sạc an toàn. Cần vốn đầu tư trụ ban đầu lớn.",
  contact: {
    full_name: "Nguyễn Đức Minh",
    student_code: "SE180793",
    team_role: "Trưởng nhóm",
    zalo: "",
    email: "",
    telegram: "",
  },
  team_context: {
    group_no: "02",
    project_name: "ChargeCampus",
    team_status_summary:
      "Nhóm 6 người (3 Kỹ thuật điện + 2 CNPM + 1 QTKD). Tự lắp được trụ sạc, có giảng viên ngành điện cố vấn kỹ thuật. EXE101 Summer 2026.",
  },
  support_needs: {
    primary_need: "critique_feasibility",
    extra_notes:
      "Giá sạc bao nhiêu thì hòa vốn tiền điện + khấu hao trụ trong 2 năm? Rào cản khi nhà trường tự làm hoặc đối thủ lớn nhảy vào? Team thiếu vai trò gì để scale?",
  },
  documents: [],
  lecturer_feedback:
    'CP3: "Bài toán tài chính chưa thuyết phục: vốn 1 trụ bao nhiêu, bao lâu hoàn vốn với 30 lượt/ngày? Rào cản khi trường tự làm hoặc đối tác lớn nhảy vào?".',
  expected_outputs:
    "Báo cáo phản biện: mô hình hoàn vốn chi tiết, rào cản cạnh tranh, team còn thiếu vai trò gì để scale.",
  boundary_confirmations: ["originality", "advisory_only", "accurate_contact"],
  school: "Đại học FPT",
  course_context: "EXE101",
};

const MINDNOTE_PRESET: IntakeData = {
  package_id: "",
  current_blocker:
    "App nhật ký tâm trạng cho sinh viên có 500 lượt tải nhưng chỉ 60 người dùng hoạt động hàng tuần. Tính năng AI an ủi viết còn chung chung, người dùng mở 2-3 lần rồi bỏ. Không dám thu phí vì sợ mất nốt người dùng ít ỏi.",
  current_situations: [
    "500 lượt tải, 60 WAU",
    "App viết bằng Flutter, đã lên cả 2 store",
    "Tính năng chính: nhật ký + AI an ủi + bài thở",
    "Chưa có chuyên gia tâm lý review nội dung",
  ],
  case_summary:
    "MindNote là nhật ký tâm trạng kèm AI an ủi và bài tập thở cho sinh viên stress mùa thi. Miễn phí, dự kiến thu từ gói premium (thống kê sâu, âm thanh ngủ). Pain: stress, mất ngủ nhưng ngại đi tư vấn. Rủi ro: nội dung AI sai lệch với người có vấn đề nặng, thiếu chuyên môn.",
  contact: {
    full_name: "Bùi Khánh Vy",
    student_code: "SS183366",
    team_role: "Trưởng nhóm",
    zalo: "",
    email: "",
    telegram: "",
  },
  team_context: {
    group_no: "18",
    project_name: "MindNote",
    team_status_summary:
      "Nhóm 5 người (3 CNPM + 1 Thiết kế + 1 Tâm lý học). Có thành viên ngành tâm lý viết kịch bản, nhưng chưa có cố vấn chuyên môn chính thức. EXE101 Fall 2026.",
  },
  support_needs: {
    primary_need: "improve_rejected_idea",
    extra_notes:
      "Giảng viên lo ngại AI an ủi người trầm cảm là nguy hiểm. Làm sao thiết kế ranh giới an toàn? Retention thấp do sản phẩm chán hay do nhu cầu không đủ đau?",
  },
  documents: [],
  lecturer_feedback:
    'CP2: "AI an ủi người có ý định tự làm hại thì sao? Phải có cơ chế phát hiện và chuyển tuyến chuyên gia. WAU 60/500 là sản phẩm chưa giữ được người dùng".',
  expected_outputs:
    "Báo cáo phản biện: ranh giới an toàn cho AI, cơ chế chuyển tuyến, nguyên nhân retention thấp và có nên thu phí premium.",
  boundary_confirmations: ["originality", "advisory_only", "accurate_contact"],
  school: "Đại học FPT",
  course_context: "EXE101",
};

const CRAFTUNI_PRESET: IntakeData = {
  package_id: "",
  current_blocker:
    "Chợ đồ handmade của sinh viên (nến thơm, móc len, sticker) đã có 25 gian hàng và doanh thu GMV 15 triệu/tháng, nhưng phàn nàn lớn nhất là ảnh sản phẩm xấu và giao hàng chậm. Phân vân giữa đầu tư chụp ảnh chung hay mở kho gom hàng.",
  current_situations: [
    "25 gian hàng sinh viên, GMV 15 triệu/tháng",
    "Hoa hồng nền tảng 12%",
    "Khiếu nại chủ yếu về ảnh xấu và ship chậm",
    "Bán qua fanpage + form đặt hàng, chưa có web",
  ],
  case_summary:
    "CraftUni là chợ đồ handmade trong trường: nến thơm, móc len, sticker, thiệp. Nền tảng thu hoa hồng 12%, hỗ trợ chụp ảnh và gom đơn giao 1 chuyến/ngày. Pain: chủ gian hàng lẻ không biết bán online, khách sợ hàng kém chất lượng. Thách thức: chuẩn hóa chất lượng và logistics.",
  contact: {
    full_name: "Phan Gia Hân",
    student_code: "SB182071",
    team_role: "Trưởng nhóm",
    zalo: "",
    email: "",
    telegram: "",
  },
  team_context: {
    group_no: "29",
    project_name: "CraftUni",
    team_status_summary:
      "Nhóm 4 người (2 QTKD + 2 Thiết kế đồ họa) tại campus Đà Nẵng. Mạnh thẩm mỹ và content, đã tổ chức 2 hội chợ offline trong trường. Yếu công nghệ và logistics. EXE101 Summer 2026.",
  },
  support_needs: {
    primary_need: "filter_select_idea",
    extra_notes:
      "Vốn ít chỉ đủ làm 1 việc: studio chụp ảnh chung cho các gian, kho gom hàng giao nhanh, hay web đặt hàng? Việc nào gỡ đúng nút thắt?",
  },
  documents: [],
  lecturer_feedback:
    'CP3: "GMV 15 triệu với hoa hồng 12% là 1.8 triệu/tháng cho 4 người — có đáng công không? Khiếu nại ảnh xấu và ship chậm, cái nào làm mất khách hơn?".',
  expected_outputs:
    "Báo cáo phản biện: nút thắt thực sự (ảnh hay ship), ưu tiên đầu tư với vốn ít, hoa hồng 12% có nuôi được team không.",
  boundary_confirmations: ["originality", "advisory_only", "accurate_contact"],
  school: "Đại học FPT",
  course_context: "EXE101",
};

export const DEMO_PRESETS: PresetOption[] = [
  {
    label: "Nexus - Nhóm 13 EXE101",
    description: "Dịch vụ audit idea khởi nghiệp cho sinh viên FPT",
    data: NEXUS_INTAKE_PRESET,
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
