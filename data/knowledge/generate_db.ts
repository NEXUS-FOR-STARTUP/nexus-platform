import { Database } from "bun:sqlite";
import { writeFileSync } from "fs";
import { resolve } from "path";

const dbPath = resolve(__dirname, "startup_knowledge.db");
const jsonPath = resolve(__dirname, "startup_knowledge.json");

const db = new Database(dbPath, { create: true });

db.run("PRAGMA journal_mode = WAL;");
db.run("PRAGMA foreign_keys = ON;");

// ============================================================================
// 1. TẠO CẤU TRÚC BẢNG (STRONG SPINE, FLEXIBLE RIBS SCHEMA)
// ============================================================================

db.run(`DROP TABLE IF EXISTS case_audit_violations;`);
db.run(`DROP TABLE IF EXISTS evaluation_indicators;`);
db.run(`DROP TABLE IF EXISTS evaluation_criteria;`);

// Bảng 1: evaluation_criteria
db.run(`
  CREATE TABLE evaluation_criteria (
    id TEXT PRIMARY KEY,
    field_code TEXT NOT NULL,
    name TEXT NOT NULL,
    weight INTEGER NOT NULL DEFAULT 1,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX idx_criteria_field_code ON evaluation_criteria(field_code);
`);

// Bảng 2: evaluation_indicators
db.run(`
  CREATE TABLE evaluation_indicators (
    id TEXT PRIMARY KEY,
    criteria_id TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    severity TEXT NOT NULL CHECK(severity IN ('BLOCKER', 'MAJOR', 'MINOR')),
    title TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    rule_data TEXT NOT NULL, -- JSONB: trigger_keywords, bad_pattern_examples, good_pattern_examples, edge_case_notes
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (criteria_id) REFERENCES evaluation_criteria(id) ON DELETE CASCADE
  );
  CREATE INDEX idx_indicators_criteria ON evaluation_indicators(criteria_id);
  CREATE INDEX idx_indicators_severity ON evaluation_indicators(severity);
  CREATE INDEX idx_indicators_code ON evaluation_indicators(code);
`);

// Bảng 3: case_audit_violations
db.run(`
  CREATE TABLE case_audit_violations (
    id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL,
    audit_round INTEGER NOT NULL DEFAULT 1,
    indicator_id TEXT NOT NULL,
    field_code TEXT NOT NULL,
    severity TEXT NOT NULL CHECK(severity IN ('BLOCKER', 'MAJOR', 'MINOR')),
    evidence TEXT NOT NULL, -- JSONB: quoted_text, analysis, recommended_action
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (indicator_id) REFERENCES evaluation_indicators(id) ON DELETE RESTRICT
  );
  CREATE INDEX idx_violations_case ON case_audit_violations(case_id, audit_round);
  CREATE INDEX idx_violations_indicator ON case_audit_violations(indicator_id);
  CREATE INDEX idx_violations_field ON case_audit_violations(field_code);
  CREATE INDEX idx_violations_severity ON case_audit_violations(severity);
`);

// View: Fast-Path Screening (Top bẫy lỗi xuất hiện nhiều nhất)
db.run(`
  CREATE VIEW IF NOT EXISTS v_top_error_indicators AS
  SELECT 
    i.id AS indicator_id,
    i.code,
    i.severity,
    i.title,
    c.field_code,
    COUNT(v.id) AS violation_count
  FROM evaluation_indicators i
  JOIN evaluation_criteria c ON i.criteria_id = c.id
  LEFT JOIN case_audit_violations v ON i.id = v.indicator_id
  GROUP BY i.id
  ORDER BY violation_count DESC;
`);

// ============================================================================
// 2. NẠP DỮ LIỆU: KHUNG TIÊU CHÍ ĐÁNH GIÁ (EVALUATION CRITERIA - 13 FIELDS CP1)
// ============================================================================

const criteriaData = [
  { id: "crit_target_customer", field_code: "target_customer", name: "Độ cụ thể và chân dung khách hàng mục tiêu", weight: 3 },
  { id: "crit_problem_statement", field_code: "problem_statement", name: "Độ rõ ràng, định lượng của nỗi đau và vấn đề", weight: 3 },
  { id: "crit_solution_description", field_code: "solution_description", name: "Tính khả thi, phạm vi tinh gọn của giải pháp", weight: 3 },
  { id: "crit_value_proposition", field_code: "value_proposition", name: "Điểm bán hàng độc nhất (USP) và rào cản sao chép", weight: 3 },
  { id: "crit_current_alternative", field_code: "current_alternative", name: "Nhận diện đúng đối thủ và giải pháp thay thế thực tế", weight: 2 },
  { id: "crit_pain_point", field_code: "pain_point", name: "Nỗi đau cốt lõi, hành vi trả tiền để giải quyết", weight: 3 },
  { id: "crit_revenue_model", field_code: "revenue_model", name: "Mô hình tạo doanh thu và định giá", weight: 2 },
  { id: "crit_unit_economics", field_code: "unit_economics", name: "Tính kinh tế trên từng đơn vị sản phẩm (CAC, Margin)", weight: 2 },
  { id: "crit_beachhead_market", field_code: "beachhead_market", name: "Thị trường ngách đầu tiên để kiểm chứng trong 7-14 ngày", weight: 3 },
  { id: "crit_competitive_moat", field_code: "competitive_moat", name: "Lợi thế cạnh tranh vượt trội (10x better hoặc khác biệt)", weight: 2 },
  { id: "crit_mvp_test_path", field_code: "mvp_test_path", name: "Khả năng ra mắt MVP tinh gọn trong 1 tháng", weight: 3 },
  { id: "crit_evidence_validation", field_code: "evidence_validation", name: "Bằng chứng thực tế (phỏng vấn, khảo sát, đặt cọc)", weight: 3 },
  { id: "crit_action_plan_7d", field_code: "action_plan_7d", name: "Kế hoạch hành động thực chiến 7 ngày sau CP1", weight: 2 },
  { id: "crit_team_structure", field_code: "team_structure", name: "Cơ cấu và năng lực thực thi của đội ngũ sáng lập", weight: 2 }
];

const insertCriteria = db.prepare(`
  INSERT INTO evaluation_criteria (id, field_code, name, weight)
  VALUES ($id, $field_code, $name, $weight)
`);

for (const c of criteriaData) {
  insertCriteria.run({
    $id: c.id,
    $field_code: c.field_code,
    $name: c.name,
    $weight: c.weight,
  });
}

// ============================================================================
// 3. NẠP DỮ LIỆU: CÁC CHỈ BÁO BẪY LỖI THỰC CHIẾN (EVALUATION INDICATORS)
// ============================================================================

const indicatorsData = [
  // 1. Target Customer
  {
    id: "ind_target_generic_student",
    criteria_id: "crit_target_customer",
    code: "ERR_TARGET_GENERIC_STUDENT",
    severity: "BLOCKER",
    title: "Khách hàng mục tiêu quá rộng hoặc dùng từ cấm chung chung",
    rule_data: {
      trigger_keywords: ["sinh viên", "người trẻ", "mọi người", "toàn quốc", "giới trẻ", "học sinh sinh viên", "tất cả các bạn"],
      bad_pattern_examples: [
        "Khách hàng mục tiêu là toàn bộ sinh viên tại các trường đại học ở Hà Nội / TP.HCM.",
        "Dự án nhắm tới những người trẻ thích du lịch, khám phá hoặc ăn uống."
      ],
      good_pattern_examples: [
        "Sinh viên năm 1-2 các trường khối kinh tế tại quận Cầu Giấy, chi tiêu sinh hoạt dưới 3 triệu/tháng và chưa từng đi làm thêm."
      ],
      edge_case_notes: "Bắt buộc phải chọn 1 nhóm beachhead duy nhất để kiểm chứng trong tuần đầu tiên."
    }
  },
  {
    id: "ind_target_multi_sided_unfocused",
    criteria_id: "crit_target_customer",
    code: "ERR_TARGET_MULTI_SIDED_UNFOCUSED",
    severity: "BLOCKER",
    title: "Gom cả người mua, người bán và người dùng dịch vụ mà không chọn bên ưu tiên",
    rule_data: {
      trigger_keywords: ["vừa người mua vừa người bán", "cả hai bên", "người mua và người bán", "nhiều nhóm đối tượng"],
      bad_pattern_examples: [
        "Nhóm nhắm đến 3 nhóm: Người mua AirPods cũ, Người bán AirPods cũ, và Người dùng dịch vụ bảo dưỡng AirPods (PodCycle v01)."
      ],
      good_pattern_examples: [
        "Giai đoạn CP1 tập trung 100% vào dịch vụ bảo dưỡng/vệ sinh AirPods cho sinh viên trong trường; sau khi có tệp người dùng ổn định mới mở sàn C2C."
      ],
      edge_case_notes: "Sàn 2 mặt (Marketplace) ở Checkpoint 1 phải chỉ rõ bên nào là con gà (Supply) và bên nào là quả trứng (Demand)."
    }
  },
  {
    id: "ind_target_overly_broad_phased",
    criteria_id: "crit_target_customer",
    code: "ERR_TARGET_OVERLY_BROAD_PHASED",
    severity: "BLOCKER",
    title: "Vẽ chân dung khách hàng trải rộng qua nhiều giai đoạn tuổi tác và phân khúc khác nhau",
    rule_data: {
      trigger_keywords: ["từ học sinh đến người đi làm", "4 giai đoạn", "học sinh, sinh viên, phụ huynh, doanh nghiệp"],
      bad_pattern_examples: [
        "Khách hàng gồm 4 giai đoạn: học sinh 16-24 tuổi, người đi làm 22-35 tuổi, phụ huynh và doanh nghiệp B2B (GiftyBox v01)."
      ],
      good_pattern_examples: [
        "Thu hẹp vào sinh viên 18-22 tuổi, đang ở ghép 2-6 người tại TP.HCM có phát sinh chi phí tiền nhà, điện nước chung hàng tháng."
      ],
      edge_case_notes: "Không thể phục vụ nhiều phân khúc có hành vi và khả năng chi trả trái ngược nhau trong giai đoạn đầu."
    }
  },
  {
    id: "ind_target_customer_unfocused_dual",
    criteria_id: "crit_target_customer",
    code: "ERR_TARGET_CUSTOMER_UNFOCUSED_DUAL",
    severity: "BLOCKER",
    title: "Gộp cả sinh viên và người đi làm trẻ mà không chọn beachhead duy nhất",
    rule_data: {
      trigger_keywords: ["sinh viên và người trẻ mới đi làm", "18-28 tuổi", "học sinh và người đi làm"],
      bad_pattern_examples: [
        "Khách hàng mục tiêu là sinh viên năm 2 đến năm cuối và người trẻ mới đi làm 18-28 tuổi tại TP.HCM và Hà Nội (Wayvee v02)."
      ],
      good_pattern_examples: [
        "Sinh viên năm 2-4 tại TP.HCM, từng đi du lịch tự túc ít nhất 1 lần trong 12 tháng, thường đi nhóm 3-5 người, ngân sách 1-3 triệu/người."
      ],
      edge_case_notes: "Sinh viên có nhiều thời gian nhưng ít tiền; người đi làm ít thời gian nhưng có ngân sách cao hơn. Không thể gộp chung."
    }
  },

  // 2. Solution & Scope
  {
    id: "ind_solution_multi_model",
    criteria_id: "crit_solution_description",
    code: "ERR_SOLUTION_MULTI_BUSINESS_MODEL",
    severity: "BLOCKER",
    title: "Ôm đồm nhiều mô hình kinh doanh trong cùng một dự án",
    rule_data: {
      trigger_keywords: ["vừa làm sàn vừa làm dịch vụ", "hệ sinh thái toàn diện", "certified B2C và C2C marketplace", "all-in-one platform"],
      bad_pattern_examples: [
        "Giải pháp gồm 3 trụ cột: Sàn C2C escrow 48h + Dòng hàng tân trang Certified B2C + Dịch vụ vệ sinh sửa chữa PodCycle Care."
      ],
      good_pattern_examples: [
        "Chỉ tập trung vào một dịch vụ duy nhất: Vệ sinh và kiểm tra pin AirPods tận nơi cho sinh viên."
      ],
      edge_case_notes: "Hệ sinh thái chỉ là lộ trình năm thứ 2-3. Tại CP1, mọi từ khóa 'hệ sinh thái' đều bị coi là phân tán nguồn lực."
    }
  },
  {
    id: "ind_solution_scope_creep_ai",
    criteria_id: "crit_solution_description",
    code: "ERR_SOLUTION_SCOPE_CREEP_AI",
    severity: "BLOCKER",
    title: "Giải pháp AI mơ hồ, ôm đồm AI tự sinh workflow cho mọi ngành nghề",
    rule_data: {
      trigger_keywords: ["AI tự động phân tích", "AI workflow generator", "tự cá nhân hóa mọi mục tiêu", "AI đa năng"],
      bad_pattern_examples: [
        "AI tự tạo workflow cá nhân hóa cho mọi bài tập của sinh viên từ CNTT, Kinh tế, Thiết kế, Slide, Code đến Viết luận (Root Access v01)."
      ],
      good_pattern_examples: [
        "Cung cấp thư viện workflow mẫu có cấu trúc (Curated Library) cho 2 task cụ thể: làm slide thuyết trình và tổng hợp tài liệu học tập."
      ],
      edge_case_notes: "Phân biệt rõ giữa Rule-based template (khả thi ở CP1) với AI Engine tự sinh quy trình (bất khả thi ở CP1)."
    }
  },
  {
    id: "ind_physical_custom_unscalable",
    criteria_id: "crit_solution_description",
    code: "ERR_PHYSICAL_CUSTOM_UNSCALABLE",
    severity: "BLOCKER",
    title: "Làm sản phẩm vật lý cá nhân hóa thủ công cho thị trường đại chúng (bất khả thi ra MVP)",
    rule_data: {
      trigger_keywords: ["hộp quà vật lý thủ công", "custom gift box", "gia công từng hộp theo yêu cầu", "sản xuất quà tặng thủ công"],
      bad_pattern_examples: [
        "Thiết kế và gia công hộp quà vật lý thủ công cho từng khách hàng cá nhân từ học sinh đến doanh nghiệp (GiftyBox v01)."
      ],
      good_pattern_examples: [
        "Pivot sang quà tặng số (E-gifts, template thiệp điện tử AI) hoặc nền tảng phần mềm giải quyết vấn đề quản lý sống chung."
      ],
      edge_case_notes: "Không có đủ thời gian và nhân lực để tự sản xuất hàng thủ công tùy biến cho số đông trong 1 tháng."
    }
  },
  {
    id: "ind_reinventing_the_wheel_tech_overkill",
    criteria_id: "crit_solution_description",
    code: "ERR_REINVENTING_THE_WHEEL_TECH_OVERKILL",
    severity: "BLOCKER",
    title: "Phát minh lại bánh xe bằng giải pháp công nghệ cồng kềnh đắt đỏ thay cho giải pháp cơ học rẻ tiền",
    rule_data: {
      trigger_keywords: ["dùng IoT nhắc tưới nước", "app điều khiển bật máy bơm khí canh", "tự động hóa thay rơ le"],
      bad_pattern_examples: [
        "Dùng cảm biến IoT và app điện thoại để theo dõi và nhắc người dùng bật máy bơm tưới nước cho hệ thống khí canh (Smart Farming v01)."
      ],
      good_pattern_examples: [
        "Sử dụng rơ-le thời gian (Timer) cơ học giá rẻ có sẵn, chuyển trọng tâm dự án sang mô hình cho thuê giàn rau và cung cấp dinh dưỡng định kỳ."
      ],
      edge_case_notes: "Công nghệ phải giải quyết bài toán chưa có lời giải tốt, không phải làm phức tạp hóa một thứ đã vận hành ổn định."
    }
  },
  {
    id: "ind_user_flow_illogical",
    criteria_id: "crit_solution_description",
    code: "ERR_USER_FLOW_ILLOGICAL",
    severity: "BLOCKER",
    title: "Luồng giải pháp sai thực tế và xung đột với hành vi khẩn cấp của người dùng",
    rule_data: {
      trigger_keywords: ["quét CV thiếu kỹ năng đề xuất học khóa học", "bù đắp kỹ năng trước khi nộp", "học xong khóa học rồi nộp"],
      bad_pattern_examples: [
        "Sau khi AI quét CV thấy thiếu kỹ năng thì tự động đề xuất khóa học bù đắp để sinh viên học xong mới đi nộp đơn (NextStep AI v01)."
      ],
      good_pattern_examples: [
        "Tập trung vào giải pháp tức thì: 1 CV : 1 JD, chỉ ra thiếu keyword nào và gợi ý viết lại bullet point dựa trên dữ liệu thật của ứng viên."
      ],
      edge_case_notes: "Ứng viên đang cần nộp CV ứng tuyển ngay, công ty không thể giữ chỗ chờ ứng viên học xong khóa học dài hạn."
    }
  },
  {
    id: "ind_domain_expertise_zero",
    criteria_id: "crit_solution_description",
    code: "ERR_DOMAIN_EXPERTISE_ZERO",
    severity: "BLOCKER",
    title: "Khởi nghiệp ở lĩnh vực chuyên sâu nhưng đội ngũ hoàn toàn không có hiểu biết và chuyên môn cốt lõi",
    rule_data: {
      trigger_keywords: ["nông nghiệp công nghệ cao mà toàn IT", "mù tịt về trồng trọt", "y tế sức khỏe mà không có chuyên môn"],
      bad_pattern_examples: [
        "Đội ngũ 100% là lập trình viên và kinh tế nhưng tự đi chế tạo giàn khí canh và pha chế dinh dưỡng nông nghiệp (Smart Farming v01)."
      ],
      good_pattern_examples: [
        "Định vị lại nhóm thành Nền tảng công nghệ trung gian (Platform), kết nối nhà vườn/nhà cung cấp chuyên nghiệp với người tiêu dùng."
      ],
      edge_case_notes: "Nếu không có chuyên môn sâu, phải định vị làm nền tảng kết nối thay vì tự chế tạo phần cứng hoặc giải pháp chuyên ngành."
    }
  },
  {
    id: "ind_basic_domain_knowledge_blunder",
    criteria_id: "crit_solution_description",
    code: "ERR_BASIC_DOMAIN_KNOWLEDGE_BLUNDER",
    severity: "BLOCKER",
    title: "Sai sót kiến thức cơ bản của ngành thể hiện sự thiếu nghiên cứu nghiêm túc",
    rule_data: {
      trigger_keywords: ["cảm biến độ ẩm đất trong khí canh", "khí canh dùng đất", "sai kiến thức chuyên môn cơ bản"],
      bad_pattern_examples: [
        "Đưa cảm biến độ ẩm đất vào hệ thống khí canh và thủy canh (vốn là phương pháp trồng cây không dùng đất)."
      ],
      good_pattern_examples: [
        "Đo các chỉ số đúng chuyên môn: độ ẩm không khí, nhiệt độ buồng phun sương, nồng độ dinh dưỡng PPM/TDS và độ pH của dung dịch."
      ],
      edge_case_notes: "Sai kiến thức cơ bản sẽ khiến toàn bộ bài thuyết trình bị đánh trượt ngay lập tức."
    }
  },

  // 3. Pain Point
  {
    id: "ind_pain_surface_level",
    criteria_id: "crit_pain_point",
    code: "ERR_PAIN_SURFACE_LEVEL",
    severity: "MAJOR",
    title: "Nỗi đau bề mặt, chưa chạm đến nguyên nhân gốc rễ và mất mát đo lường được",
    rule_data: {
      trigger_keywords: ["mất thời gian", "cảm thấy bất tiện", "khó khăn", "không biết làm sao", "thiếu tự tin chung chung"],
      bad_pattern_examples: [
        "Sinh viên cảm thấy mất thời gian và khó khăn khi tìm kiếm đồ ăn trưa hoặc khi làm assignment.",
        "Người trẻ e ngại khi tham gia hoạt động một mình nhưng không nói rõ mất mát cụ thể là gì."
      ],
      good_pattern_examples: [
        "Sinh viên phải xếp hàng chờ nhận đồ ăn 25-35 phút dưới nắng tại cổng trường, bị trễ giờ học ca chiều và đồ ăn bị nguội/đổ nước canh.",
        "Ứng viên bị trượt ngay từ vòng quét CV đầu tiên do CV dài 3 trang lan man, không khớp từ khóa ATS của nhà tuyển dụng IT."
      ],
      edge_case_notes: "Nỗi đau thực sự phải dẫn đến mất mát cụ thể về tiền bạc, thời gian định lượng hoặc cơ hội bị từ chối."
    }
  },
  {
    id: "ind_invented_pain_point",
    criteria_id: "crit_pain_point",
    code: "ERR_INVENTED_PAIN_POINT",
    severity: "BLOCKER",
    title: "Tự phát minh ra nỗi đau phi thực tế không tồn tại trên thị trường",
    rule_data: {
      trigger_keywords: ["PT bị bùng kèo quỵt tiền", "học viên gym tập online tại nhà", "nỗi đau huyễn hoặc"],
      bad_pattern_examples: [
        "Nữ văn phòng sợ PT lừa đảo, còn PT thì hay bị học viên quỵt tiền học phí nên cần app giữ tiền trung gian (FitMatch Vietnam v01)."
      ],
      good_pattern_examples: [
        "Nỗi đau thực tế: Khách hàng nhắn tin hỏi giá makeup artist phải chờ đợi lâu, MUA freelance hay bị khách hủy lịch phút chót (no-show)."
      ],
      edge_case_notes: "Khách đi tập gym thuê PT thường đóng tiền trước cho trung tâm thể hình uy tín, không có chuyện quỵt tiền hay bùng kèo như tưởng tượng."
    }
  },
  {
    id: "ind_current_alt_superficial",
    criteria_id: "crit_current_alternative",
    code: "ERR_CURRENT_ALT_SUPERFICIAL",
    severity: "MAJOR",
    title: "Nhận diện giải pháp thay thế hời hợt, bỏ qua thói quen lớn nhất là 'không làm gì cả' hoặc tự chịu đựng",
    rule_data: {
      trigger_keywords: ["chưa có giải pháp nào tương tự", "thị trường chưa ai làm", "đối thủ không có"],
      bad_pattern_examples: [
        "Thị trường hiện tại chỉ có ứng dụng hẹn hò, chưa có nền tảng nào kết nối bạn đồng hành trải nghiệm đời thực (Phimium v01)."
      ],
      good_pattern_examples: [
        "Nhận diện thói quen tự thay thế: Khi không có ai đi cùng, phần lớn sinh viên chọn Ở NHÀ LƯỚT TIKTOK/XEM PHIM hoặc từ bỏ ý định tham gia."
      ],
      edge_case_notes: "Đối thủ lớn nhất của mọi startup thường không phải là app tương tự, mà là thói quen 'ở nhà / làm theo cách thủ công / tự chịu đựng' của khách hàng."
    }
  },

  // 4. Value Proposition & Moat
  {
    id: "ind_value_prop_overclaim",
    criteria_id: "crit_value_proposition",
    code: "ERR_VALUE_PROP_OVERCLAIM",
    severity: "MAJOR",
    title: "Tuyên bố giá trị quá đà, cam kết uy tín tuyệt đối khi chưa có cơ chế kiểm định",
    rule_data: {
      trigger_keywords: ["uy tín tuyệt đối", "chất lượng chuẩn 100%", "bảo đảm số 1", "chính xác tuyệt đối"],
      bad_pattern_examples: [
        "PODCYCLE Certified đảm bảo pin dung lượng chuẩn 100%, uy tín tuyệt đối so với chợ đồ cũ.",
        "Nền tảng cam kết mọi người dùng đều tìm được bạn đồng hành 100% an toàn và phù hợp tính cách."
      ],
      good_pattern_examples: [
        "Đo dung lượng pin công khai bằng phần mềm chuyên dụng và cam kết hoàn tiền 100% nếu pin dưới 80% trong 7 ngày."
      ],
      edge_case_notes: "Tránh mọi từ ngữ khẳng định tuyệt đối (100%, hoàn hảo, tuyệt đối) khi chưa có hệ thống chứng nhận độc lập."
    }
  },
  {
    id: "ind_no_moat_chatgpt_wrapper",
    criteria_id: "crit_value_proposition",
    code: "ERR_NO_MOAT_CHATGPT_WRAPPER",
    severity: "BLOCKER",
    title: "Không có rào cản cạnh tranh, sản phẩm là ChatGPT wrapper người dùng tự làm được",
    rule_data: {
      trigger_keywords: ["hỏi ChatGPT ngon hơn", "ChatGPT wrapper", "không có USP so với AI", "nhập nguyên liệu gợi ý món"],
      bad_pattern_examples: [
        "Nhập nguyên liệu thừa trong tủ lạnh để AI gợi ý công thức món ăn (SmartMeal v01).",
        "Dùng AI quét CV để sửa văn phong câu chữ chung chung (NextStep AI v01)."
      ],
      good_pattern_examples: [
        "SmartMeal: Gợi ý món ăn kết hợp hồ sơ bệnh lý, cảnh báo dị ứng và tạo giỏ hàng mua nguyên liệu tự động qua Affiliate Shopee/TikTok Shop.",
        "NextStep AI: Luồng phân tích cố định 1 CV : 1 JD, bóc tách tỷ lệ bao phủ JD Coverage Score và gợi ý cấu trúc viết lại theo mô hình STAR."
      ],
      edge_case_notes: "Nếu giá trị cốt lõi có thể đạt được bằng 1 câu prompt đơn giản trên ChatGPT miễn phí, sản phẩm không có lý do tồn tại."
    }
  },
  {
    id: "ind_ai_evaluation_groundless",
    criteria_id: "crit_value_proposition",
    code: "ERR_AI_EVALUATION_GROUNDLESS",
    severity: "BLOCKER",
    title: "AI chấm điểm đánh giá nhưng không có dữ liệu gốc hoặc rubric thực tế từ doanh nghiệp",
    rule_data: {
      trigger_keywords: ["chấm điểm tương thích không có rubric", "AI tự chấm độ khớp", "không biết barem nhà tuyển dụng"],
      bad_pattern_examples: [
        "AI tự động đối chiếu CV với JD để chấm điểm % tương thích trúng tuyển khi nhóm không có rubric hay yêu cầu ngầm của nhà tuyển dụng (NextStep AI v01)."
      ],
      good_pattern_examples: [
        "Đổi Match Score thành JD Coverage Score (độ bao phủ từ khóa và yêu cầu công khai của JD), nêu rõ không cam kết tỷ lệ trúng tuyển."
      ],
      edge_case_notes: "AI không thể đoán được văn hóa ngầm hay barem điểm nội bộ của từng công ty."
    }
  },
  {
    id: "ind_ats_overclaim",
    criteria_id: "crit_value_proposition",
    code: "ERR_ATS_OVERCLAIM",
    severity: "MAJOR",
    title: "Thần thánh hóa ATS, tuyên bố doanh nghiệp phụ thuộc hoàn toàn vào hệ thống lọc tự động",
    rule_data: {
      trigger_keywords: ["bị ATS loại ngay lập tức", "70-80% CV bị lọc", "ATS mù thông tin", "doanh nghiệp hoàn toàn dùng ATS"],
      bad_pattern_examples: [
        "Hồ sơ của bạn bị hệ thống ATS tự động loại bỏ ngay lập tức trước khi đến tay nhà tuyển dụng."
      ],
      good_pattern_examples: [
        "Có nguy cơ bị đánh giá thấp ở vòng lọc hồ sơ vì CV chưa làm nổi bật các kỹ năng và từ khóa trọng tâm trong JD."
      ],
      edge_case_notes: "Rất nhiều doanh nghiệp tại Việt Nam tuyển intern/OJT vẫn lọc hồ sơ thủ công qua email hoặc form đăng ký."
    }
  },
  {
    id: "ind_match_score_misleading",
    criteria_id: "crit_value_proposition",
    code: "ERR_MATCH_SCORE_MISLEADING",
    severity: "MAJOR",
    title: "Điểm số Match Score gây hiểu nhầm thành tỷ lệ trúng tuyển hoặc cam kết pass phỏng vấn",
    rule_data: {
      trigger_keywords: ["Match Score 80% cơ hội đậu", "tỷ lệ đậu tuyển dụng", "AI chấm đỗ"],
      bad_pattern_examples: [
        "Điểm Match Score 85% thể hiện bạn có 85% cơ hội được nhà tuyển dụng gọi đi phỏng vấn."
      ],
      good_pattern_examples: [
        "JD Coverage Score thể hiện mức độ xuất hiện các yêu cầu trong JD trên CV của bạn, giúp bạn biết phần nào cần bổ sung."
      ],
      edge_case_notes: "Bắt buộc phải có disclaimer: Điểm số không dự đoán khả năng tuyển dụng thực tế."
    }
  },
  {
    id: "ind_ai_fabricating_experience",
    criteria_id: "crit_value_proposition",
    code: "ERR_AI_FABRICATING_EXPERIENCE",
    severity: "MAJOR",
    title: "AI viết lại CV tự ý bịa thêm số liệu và kinh nghiệm mà ứng viên không có thật",
    rule_data: {
      trigger_keywords: ["AI tự bịa số liệu", "tự thêm kết quả 40%", "viết lại CV phóng đại"],
      bad_pattern_examples: [
        "AI tự động sửa dòng 'Quản lý fanpage CLB' thành 'Tăng 40% engagement qua chiến dịch đa kênh' dù ứng viên chưa từng đạt số liệu đó."
      ],
      good_pattern_examples: [
        "AI cung cấp cấu trúc câu chuẩn (Action Verb + Context + Result) và đặt câu hỏi để ứng viên tự điền số liệu thực tế."
      ],
      edge_case_notes: "Việc bịa số liệu tạo ra rủi ro đạo đức và khiến ứng viên bị bóc mẽ trong vòng phỏng vấn thật."
    }
  },
  {
    id: "ind_value_prop_unsupported_time_claim",
    criteria_id: "crit_value_proposition",
    code: "ERR_VALUE_PROP_UNSUPPORTED_TIME_CLAIM",
    severity: "MAJOR",
    title: "Tuyên bố rút ngắn thời gian ấn tượng nhưng không có số liệu chứng minh hoặc phương pháp đo",
    rule_data: {
      trigger_keywords: ["giảm từ vài ngày xuống 10 phút", "nhanh hơn 10 lần mà không đo", "tiết kiệm 90% thời gian"],
      bad_pattern_examples: [
        "WAYVEE giúp giảm thời gian lên lịch trình du lịch từ vài giờ/vài ngày xuống còn 10-15 phút (Wayvee v02)."
      ],
      good_pattern_examples: [
        "Đo lường thời gian tạo lịch trình thủ công trung bình (4-6 giờ) so với thời gian điền form (5 phút) và nhận bản tổng hợp Notion."
      ],
      edge_case_notes: "Mọi tuyên bố về hiệu suất thời gian đều phải có bài test A/B đối chứng thực tế."
    }
  },

  // 5. Business Model & Escrow
  {
    id: "ind_escrow_p2p_legal_trust_crash",
    criteria_id: "crit_revenue_model",
    code: "ERR_ESCROW_P2P_LEGAL_TRUST_CRASH",
    severity: "BLOCKER",
    title: "Giữ tiền trung gian P2P giữa các cá nhân vãng lai không có tư cách pháp lý và uy tín bảo chứng",
    rule_data: {
      trigger_keywords: ["app sinh viên giữ tiền cọc", "escrow P2P", "thu cọc tiểu thương", "giữ lương nhân viên thời vụ"],
      bad_pattern_examples: [
        "App Hands-Free yêu cầu chủ sạp chuyển tiền công vào app giữ trước, khi sinh viên làm xong mới giải ngân (Hands-Free v01)."
      ],
      good_pattern_examples: [
        "Chuyển sang mô hình Matching Fee (phí kết nối 10.000đ - 20.000đ/lượt ghép thành công), tuyệt đối không đụng vào dòng tiền lương của người lao động."
      ],
      edge_case_notes: "Khách hàng sợ startup sinh viên ôm tiền cọc bỏ trốn hơn là sợ người làm bùng việc."
    }
  },
  {
    id: "ind_touching_salary_flow",
    criteria_id: "crit_revenue_model",
    code: "ERR_TOUCHING_SALARY_FLOW",
    severity: "BLOCKER",
    title: "Chạm vào dòng tiền lương người lao động mà không có giấy phép trung gian thanh toán",
    rule_data: {
      trigger_keywords: ["giữ lương", "trả lương qua app", "chiết khấu lương"],
      bad_pattern_examples: [
        "Nền tảng đứng ra thu toàn bộ tiền lương từ chủ sạp rồi trích hoa hồng 10% trước khi trả cho sinh viên."
      ],
      good_pattern_examples: [
        "Hai bên tự thanh toán lương trực tiếp cho nhau; nền tảng chỉ thu phí môi giới thông tin tuyển dụng."
      ],
      edge_case_notes: "Giữ lương người lao động vi phạm quy định pháp luật lao động và trung gian thanh toán."
    }
  },
  {
    id: "ind_data_privacy_unaddressed",
    criteria_id: "crit_revenue_model",
    code: "ERR_DATA_PRIVACY_UNADDRESSED",
    severity: "MAJOR",
    title: "Thu thập dữ liệu cá nhân nhạy cảm nhưng không có chính sách bảo mật, ẩn danh hoặc cam kết xóa",
    rule_data: {
      trigger_keywords: ["upload CV chứa thông tin cá nhân", "không có chính sách bảo mật", "lộ số điện thoại email"],
      bad_pattern_examples: [
        "Người dùng upload CV đầy đủ họ tên, SĐT, địa chỉ nhà lên hệ thống nhưng tài liệu không đề cập đến việc lưu trữ hay bảo vệ dữ liệu."
      ],
      good_pattern_examples: [
        "Cam kết chỉ dùng dữ liệu cho phiên phân tích hiện tại, không dùng để train AI công khai và xóa file sau 24h; cho phép ẩn thông tin nhạy cảm."
      ],
      edge_case_notes: "Dữ liệu CV và hồ sơ cá nhân là dữ liệu nhạy cảm theo Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân."
    }
  },
  {
    id: "ind_partner_mixed_with_datasource",
    criteria_id: "crit_revenue_model",
    code: "ERR_PARTNER_MIXED_WITH_DATASOURCE",
    severity: "BLOCKER",
    title: "Trộn lẫn giữa nguồn dữ liệu công khai (Data Source) với đối tác kinh doanh (Business Partner)",
    rule_data: {
      trigger_keywords: ["đối tác là Google Maps và TikTok", "partner là Google", "trộn data source với partner"],
      bad_pattern_examples: [
        "Liệt kê Google Maps, TikTok, Google Search và các nhà hàng địa phương vào cùng một danh sách Đối tác (Partners) của Wayvee."
      ],
      good_pattern_examples: [
        "Tách bạch: Data source là Google Maps/TikTok (công khai, không có hợp đồng); Đối tác thương mại là các nhà hàng, homestay có ký kết thỏa thuận hoa hồng."
      ],
      edge_case_notes: "Các nền tảng công nghệ lớn không phải là đối tác mặc định của startup nếu chưa ký kết hợp đồng thương mại."
    }
  },
  {
    id: "ind_logic_illogical_financial_claim",
    criteria_id: "crit_revenue_model",
    code: "ERR_LOGIC_ILLOGICAL_FINANCIAL_CLAIM",
    severity: "BLOCKER",
    title: "Lập luận tài chính vô lý khi so sánh giá đồ thừa với chi phí ăn ngoài",
    rule_data: {
      trigger_keywords: ["so sánh giá đồ thừa với ăn ngoài", "tiết kiệm bằng đồ thừa", "lập luận tài chính tào lao"],
      bad_pattern_examples: [
        "Claim tính năng quản lý tài chính bằng cách lấy đồ ăn thừa trong tủ lạnh nấu rồi so sánh với giá mua món đó ở nhà hàng để bảo tiết kiệm."
      ],
      good_pattern_examples: [
        "Định lượng chi phí thực phẩm mua mới theo khẩu phần bữa ăn và gợi ý combo nguyên liệu tiết kiệm cho 3-5 ngày."
      ],
      edge_case_notes: "Đồ thừa trong tủ lạnh là chi phí chìm (sunk cost), không thể so sánh với giá bán của nhà hàng để tạo giá trị tài chính."
    }
  },

  // 6. Unit Economics
  {
    id: "ind_unit_economics_negative",
    criteria_id: "crit_unit_economics",
    code: "ERR_UNIT_ECONOMICS_NEGATIVE",
    severity: "BLOCKER",
    title: "Mô hình kinh tế đơn vị âm bản, càng bán nhiều càng lỗ nặng",
    rule_data: {
      trigger_keywords: ["lỗ trên từng đơn", "free ship 100%", "bù lỗ phí vận chuyển", "biên lợi nhuận gộp âm"],
      bad_pattern_examples: [
        "Bán suất cơm 25.000đ, miễn phí giao hàng tận phòng ký túc xá, chi phí shipper nội bộ 5.000đ/đơn, biên lợi nhuận món ăn chỉ 3.000đ (Flunch v01)."
      ],
      good_pattern_examples: [
        "Gộp đơn hàng theo khung giờ cố định (Batch Delivery) tại một điểm tập kết sảnh ký túc xá, thu phí dịch vụ 2.000đ/đơn."
      ],
      edge_case_notes: "Phải tính đủ chi phí vận hành biến đổi (Packaging, Shipper, Payment Gateway fee) trước khi tính lợi nhuận gộp."
    }
  },

  // 7. Validation Plan & Team
  {
    id: "ind_success_metrics_self_reported",
    criteria_id: "crit_evidence_validation",
    code: "ERR_SUCCESS_METRICS_SELF_REPORTED",
    severity: "MAJOR",
    title: "Tiêu chí thành công chỉ dựa trên khảo sát cảm nhận tự báo cáo thay vì hành vi thực tế",
    rule_data: {
      trigger_keywords: ["70% thấy hữu ích", "khảo sát thích sản phẩm", "hài lòng qua Google Form"],
      bad_pattern_examples: [
        "Tiêu chí thành công của MVP là 80% sinh viên tham gia khảo sát nói rằng họ thấy ứng dụng hữu ích và sẽ ủng hộ."
      ],
      good_pattern_examples: [
        "Đo lường hành vi thật: Tỷ lệ click vào nút Mua ngay (Fake Door Test), số người sẵn sàng để lại số điện thoại hoặc nộp cọc trước."
      ],
      edge_case_notes: "Khách hàng nói thích là miễn phí; chỉ khi họ bỏ thời gian dùng thử hoặc bỏ tiền đặt cọc mới là bằng chứng thực tế."
    }
  },
  {
    id: "ind_team_superficial_rote_reading",
    criteria_id: "crit_team_structure",
    code: "ERR_TEAM_SUPERFICIAL_ROTE_READING",
    severity: "MAJOR",
    title: "Thuyết trình đọc vẹt đối phó, đội ngũ trên giấy hoành tráng nhưng thực tế không hiểu dự án",
    rule_data: {
      trigger_keywords: ["cầm điện thoại đọc như trả bài", "làm việc đối phó", "đội hình mạnh trên giấy nhưng hời hợt"],
      bad_pattern_examples: [
        "Thành viên đại diện lên thuyết trình chỉ cầm điện thoại đọc từng chữ trên slide, không trả lời được các câu hỏi phản biện thực tế (Hands-Free v01)."
      ],
      good_pattern_examples: [
        "Thành viên nắm chắc số liệu thực địa, trình bày lưu loát insight từ 5-10 cuộc phỏng vấn khách hàng sâu và demo prototype trơn tru."
      ],
      edge_case_notes: "Giảng viên và nhà đầu tư đánh giá thái độ và mức độ thấu hiểu khách hàng cao hơn số lượng bằng cấp trên giấy."
    }
  }
];

const insertIndicator = db.prepare(`
  INSERT INTO evaluation_indicators (id, criteria_id, code, severity, title, rule_data)
  VALUES ($id, $criteria_id, $code, $severity, $title, $rule_data)
`);

for (const ind of indicatorsData) {
  insertIndicator.run({
    $id: ind.id,
    $criteria_id: ind.criteria_id,
    $code: ind.code,
    $severity: ind.severity,
    $title: ind.title,
    $rule_data: JSON.stringify(ind.rule_data),
  });
}

// ============================================================================
// 4. NẠP DỮ LIỆU: HỒ SƠ VI PHẠM THỰC CHIẾN TỪ TOÀN BỘ 12 NHÓM (CASE AUDIT VIOLATIONS)
// ============================================================================

const violationsData = [
  // Group 0001_26: PODCYCLE (Sàn & Sửa chữa AirPods)
  {
    id: "viol_0001_1",
    case_id: "0001_26",
    audit_round: 1,
    indicator_id: "ind_solution_multi_model",
    field_code: "solution_description",
    severity: "BLOCKER",
    evidence: {
      quoted_text: "Giải pháp của nhóm gồm 3 trụ cột: Sàn giao dịch C2C chuyên biệt AirPods và linh kiện lẻ (escrow 48h), Dòng hàng PODCYCLE Certified thu gom tân trang bán lại, và Dịch vụ PODCYCLE Care vệ sinh thay pin sửa chữa.",
      analysis: "Nhóm đang ôm đồm 3 mô hình kinh doanh hoàn toàn khác nhau: C2C Marketplace, B2C Refurbished, và Service Lab. Checkpoint 1 không thể kiểm chứng cùng lúc 3 mô hình này.",
      recommended_action: "Thu hẹp về một mô hình duy nhất dễ kiểm chứng nhất trong 7 ngày: Dịch vụ vệ sinh & kiểm tra AirPods tại trường (PODCYCLE Care); cắt bỏ toàn bộ sàn giao dịch C2C và escrow."
    }
  },
  {
    id: "viol_0001_2",
    case_id: "0001_26",
    audit_round: 1,
    indicator_id: "ind_target_multi_sided_unfocused",
    field_code: "target_customer",
    severity: "BLOCKER",
    evidence: {
      quoted_text: "Nhóm nhắm đến 3 nhóm khách hàng chính: 1. Người mua AirPods cũ, 2. Người bán AirPods cũ, 3. Người dùng dịch vụ bảo dưỡng/sửa chữa AirPods.",
      analysis: "Khách hàng bị phân mảnh thành 3 luồng hành vi độc lập. Người mua sợ chất lượng pin/tai, người bán muốn thanh lý nhanh, người sửa muốn phục hồi máy đang dùng.",
      recommended_action: "Chọn 1 nhóm duy nhất làm beachhead: Sinh viên FPT đang dùng AirPods bị bẩn hoặc chai pin cần làm sạch/kiểm tra."
    }
  },
  {
    id: "viol_0001_3",
    case_id: "0001_26",
    audit_round: 1,
    indicator_id: "ind_value_prop_overclaim",
    field_code: "value_proposition",
    severity: "MAJOR",
    evidence: {
      quoted_text: "Bảo hộ chất lượng phần cứng, PODCYCLE Certified uy tín tuyệt đối, pin dung lượng chuẩn 100%.",
      analysis: "Nhóm tự đưa ra chứng nhận Certified và cam kết chất lượng tuyệt đối trong khi chưa có quy trình kiểm định kỹ thuật hay máy đo kiểm chứng.",
      recommended_action: "Sửa thành cam kết cụ thể: Đo dung lượng pin bằng phần mềm/thiết bị đo trực tiếp trước mặt khách và hoàn tiền nếu không đạt tiêu chuẩn cam kết."
    }
  },

  // Group 0002_155: ROOT ACCESS (AI Workflow Assistant)
  {
    id: "viol_0002_1",
    case_id: "0002_155",
    audit_round: 1,
    indicator_id: "ind_solution_scope_creep_ai",
    field_code: "solution_description",
    severity: "BLOCKER",
    evidence: {
      quoted_text: "Hệ thống AI Workflow Generator tự động phân tích mục tiêu bài tập của sinh viên và tạo ra quy trình cá nhân hóa kết hợp các công cụ AI tối ưu nhất.",
      analysis: "Tài liệu dao động giữa 'thư viện quy trình mẫu thủ công' và 'hệ thống AI tự sinh workflow'. Tính năng AI sinh workflow cho mọi ngành nghề là quá rộng và bất khả thi để hoàn thành trong CP1.",
      recommended_action: "Chuyển toàn bộ giải pháp sang Curated Workflow Library (thư viện workflow mẫu chuẩn hóa trên Notion/Web) cho 2 task cụ thể: Làm slide thuyết trình và Tổng hợp tài liệu báo cáo."
    }
  },
  {
    id: "viol_0002_2",
    case_id: "0002_155",
    audit_round: 1,
    indicator_id: "ind_target_generic_student",
    field_code: "target_customer",
    severity: "MAJOR",
    evidence: {
      quoted_text: "Sinh viên Đại học FPT từ năm 1 đến năm 4, thuộc các ngành CNTT, Kinh doanh, Thiết kế và Truyền thông làm bài tập nhóm hoặc project học kỳ.",
      analysis: "Gom quá nhiều ngành có nhu cầu và hành vi AI hoàn toàn khác nhau. Sinh viên CNTT cần AI để code và debug; sinh viên Kinh doanh cần AI nghiên cứu thị trường và làm slide.",
      recommended_action: "Thu hẹp nhóm đầu tiên: Sinh viên FPT năm 2-3 khối ngành Kinh tế/Marketing/EXE101 thường xuyên phải làm slide và báo cáo môn học."
    }
  },

  // Group 0003_122: NEXTSTEP AI (Nền tảng hướng nghiệp & sửa CV)
  {
    id: "viol_0003_1",
    case_id: "0003_122",
    audit_round: 1,
    indicator_id: "ind_user_flow_illogical",
    field_code: "solution_description",
    severity: "BLOCKER",
    evidence: {
      quoted_text: "Sau khi AI quét CV, nếu thấy thiếu kỹ năng thì sẽ tự động liên kết đề xuất khóa học bù đắp.",
      analysis: "Sinh viên đang nộp CV đi xin việc ngay, chờ học xong khóa học đó rồi công ty có còn giữ chỗ nhận mình nữa không? Luồng thiết kế này hoàn toàn sai với hành vi thực tế của người đi xin việc.",
      recommended_action: "Bỏ hoàn toàn tính năng đề xuất khóa học; tập trung vào luồng 1 CV : 1 JD, chỉ ra thiếu sót từ khóa và hướng dẫn sửa ngay bullet point."
    }
  },
  {
    id: "viol_0003_2",
    case_id: "0003_122",
    audit_round: 1,
    indicator_id: "ind_ai_evaluation_groundless",
    field_code: "value_proposition",
    severity: "BLOCKER",
    evidence: {
      quoted_text: "AI sẽ đối chiếu CV với JD (Mô tả công việc) để chấm điểm tương thích.",
      analysis: "Nhóm không có rubric chấm điểm hay yêu cầu ngầm của nhà tuyển dụng để AI có cơ sở đánh giá. Mọi phân tích chỉ là chung chung, máy móc và hỏi ChatGPT trực tiếp còn tốt hơn.",
      recommended_action: "Đổi thành JD Coverage Score (chỉ đo độ bao phủ từ khóa và kinh nghiệm nêu trong JD), không cam kết tỷ lệ đỗ phỏng vấn."
    }
  },
  {
    id: "viol_0003_3",
    case_id: "0003_122",
    audit_round: 1,
    indicator_id: "ind_ats_overclaim",
    field_code: "value_proposition",
    severity: "MAJOR",
    evidence: {
      quoted_text: "70-80% CV bị hệ thống ATS tự động loại bỏ ngay lập tức trước khi đến tay nhà tuyển dụng.",
      analysis: "Nhiều doanh nghiệp tuyển intern/OJT tại Việt Nam vẫn lọc CV thủ công qua email hoặc form. Claim quá mạnh khiến bài phản biện dễ bị bắt bẻ.",
      recommended_action: "Sửa thành 'Có nguy cơ bị đánh giá thấp ở vòng lọc hồ sơ vì CV chưa làm nổi bật các yêu cầu quan trọng trong JD'."
    }
  },
  {
    id: "viol_0003_4",
    case_id: "0003_122",
    audit_round: 1,
    indicator_id: "ind_data_privacy_unaddressed",
    field_code: "revenue_model",
    severity: "MAJOR",
    evidence: {
      quoted_text: "Người dùng tải lên CV bản gốc đầy đủ thông tin cá nhân để hệ thống quét.",
      analysis: "CV chứa họ tên, số điện thoại, email, địa chỉ nhưng nhóm không có chính sách bảo mật, cam kết không dùng để train model hay cơ chế xóa dữ liệu.",
      recommended_action: "Bổ sung chính sách Data Privacy: xóa tệp sau khi phân tích, không train model công khai và khuyến khích ẩn thông tin nhạy cảm trong bản demo."
    }
  },

  // Group 0004_133: GIFTYBOX / HOUSEMATE (Nền tảng sinh hoạt ở ghép)
  {
    id: "viol_0004_1",
    case_id: "0004_133",
    audit_round: 1,
    indicator_id: "ind_target_overly_broad_phased",
    field_code: "target_customer",
    severity: "BLOCKER",
    evidence: {
      quoted_text: "Vẽ ra 4 giai đoạn khách hàng: từ học sinh 16-24 tuổi, người đi làm 22-35 tuổi, phụ huynh và cả doanh nghiệp B2B.",
      analysis: "Làm quà tặng cá nhân hóa cho một tệp khách hàng tràng giang đại hải. Chỉ phục vụ nhu cầu tặng quà của sinh viên FPT nhóm đã không đáp ứng nổi.",
      recommended_action: "Thu hẹp vào tệp khách hàng Gen Z hoặc pivot sang nền tảng số giải quyết vấn đề quản lý phòng trọ sinh viên."
    }
  },
  {
    id: "viol_0004_2",
    case_id: "0004_133",
    audit_round: 1,
    indicator_id: "ind_physical_custom_unscalable",
    field_code: "solution_description",
    severity: "BLOCKER",
    evidence: {
      quoted_text: "Gia công và sản xuất hộp quà vật lý thủ công cá nhân hóa theo yêu cầu cho từng khách hàng.",
      analysis: "Thiết kế hộp quà vật lý thủ công cho từng cá nhân với quy mô thị trường lớn là hoàn toàn bất khả thi để ra được MVP trong 1 tháng.",
      recommended_action: "Từ bỏ sản phẩm vật lý thủ công, chuyển sang nền tảng web/app Housemate giải quyết bài toán chia tiền điện nước và việc nhà sinh viên."
    }
  },

  // Group 0005_42: FITMATCH / BEAUTY HUB (Đặt lịch Makeup Artist)
  {
    id: "viol_0005_1",
    case_id: "0005_42",
    audit_round: 1,
    indicator_id: "ind_invented_pain_point",
    field_code: "pain_point",
    severity: "BLOCKER",
    evidence: {
      quoted_text: "Nữ văn phòng 25-32 tuổi sợ bị PT lừa đảo, PT sợ bị học viên bùng kèo quỵt tiền nên cần app trung gian thanh toán giữ tiền (FitMatch).",
      analysis: "Nhóm tự phát minh ra nỗi đau. Người đi tập gym thuê PT đóng tiền cho trung tâm uy tín từ trước, hoàn toàn không có chuyện quỵt tiền hay bùng kèo.",
      recommended_action: "Đổi đề tài sang BeautyHub: Nền tảng kết nối Makeup Artist freelance với nữ Gen Z 18-25 đi tiệc, giải quyết nỗi đau no-show bằng tiền cọc tự động."
    }
  },

  // Group 0006_47: PHIMIUM (Experience Buddy Platform)
  {
    id: "viol_0006_1",
    case_id: "0006_47",
    audit_round: 1,
    indicator_id: "ind_target_generic_student",
    field_code: "target_customer",
    severity: "MAJOR",
    evidence: {
      quoted_text: "Giới trẻ từ 18-35 tuổi có nhu cầu trải nghiệm các hoạt động ngoài đời thực như workshop, triển lãm, cafe nhưng thiếu người đồng hành.",
      analysis: "Độ tuổi 18-35 là dải quá rộng (bao gồm cả học sinh, sinh viên, người đi làm và người đã có gia đình). Không thể kiểm chứng nhu cầu trong 7 ngày với phân khúc này.",
      recommended_action: "Thu hẹp vào Beachhead: Sinh viên năm nhất - năm hai vừa chuyển từ các tỉnh đến TP.HCM trọ học một mình và chưa có bạn bè đi cùng."
    }
  },
  {
    id: "viol_0006_2",
    case_id: "0006_47",
    audit_round: 1,
    indicator_id: "ind_current_alt_superficial",
    field_code: "current_alternative",
    severity: "MAJOR",
    evidence: {
      quoted_text: "Thị trường hiện tại chỉ có ứng dụng hẹn hò hoặc hội nhóm mạng xã hội, chưa có nền tảng nào kết nối bạn đồng hành trải nghiệm đời thực.",
      analysis: "Bỏ qua giải pháp thay thế thực tế lớn nhất của đối tượng mục tiêu: Khi không có bạn đi cùng, phần lớn sinh viên chọn Ở NHÀ LƯỚT TIKTOK / XEM PHIM chứ không chủ động tìm người lạ.",
      recommended_action: "Bổ sung thói quen 'chấp nhận từ bỏ trải nghiệm' vào Current Alternative và thiết kế cơ chế Buddy an toàn để vượt qua rào cản sợ người lạ."
    }
  },

  // Group 0007_221: SMART FARMING / AEROGREEN HUB (Thuê giàn khí canh đô thị)
  {
    id: "viol_0007_1",
    case_id: "0007_221",
    audit_round: 1,
    indicator_id: "ind_domain_expertise_zero",
    field_code: "solution_description",
    severity: "BLOCKER",
    evidence: {
      quoted_text: "Đội ngũ gồm 3 lập trình viên IT, 1 kinh tế và 1 truyền thông tự nghiên cứu và sản xuất trọn gói hệ thống giàn trồng khí canh thông minh.",
      analysis: "Cả nhóm không có bất kỳ thành viên nào có kiến thức hay kinh nghiệm về nông nghiệp. Việc mù tịt chuyên môn cốt lõi dẫn đến giải pháp vô lý và xa rời thực tế.",
      recommended_action: "Chuyển thành nền tảng trung gian (AeroGreen Hub) kết nối các nhà vườn/nhà cung cấp giàn rau uy tín với khách hàng chung cư."
    }
  },
  {
    id: "viol_0007_2",
    case_id: "0007_221",
    audit_round: 1,
    indicator_id: "ind_reinventing_the_wheel_tech_overkill",
    field_code: "solution_description",
    severity: "BLOCKER",
    evidence: {
      quoted_text: "Hệ thống tích hợp cảm biến IoT và app điện thoại để theo dõi và nhắc nhở bật máy bơm tưới nước cho giàn khí canh.",
      analysis: "Phát minh lại cái bánh xe bằng công nghệ đắt đỏ. Khí canh đã tự động hóa bằng Timer rơ-le rẻ tiền hàng chục năm nay, không ai cần app để châm nước.",
      recommended_action: "Dùng Timer có sẵn, tập trung giải quyết rào cản chi phí bằng gói 'Cho thuê giàn khí canh 1-3 tháng' để khách hàng trải nghiệm thử."
    }
  },
  {
    id: "viol_0007_3",
    case_id: "0007_221",
    audit_round: 1,
    indicator_id: "ind_basic_domain_knowledge_blunder",
    field_code: "solution_description",
    severity: "BLOCKER",
    evidence: {
      quoted_text: "Gắn cảm biến đo độ ẩm đất vào các ống khí canh để cảnh báo thiếu nước.",
      analysis: "Khí canh và thủy canh trồng bằng giá thể phơi trong không khí, không dùng đất. Đưa cảm biến độ ẩm đất vào là sai kiến thức cơ bản.",
      recommended_action: "Đo nồng độ dinh dưỡng TDS và pH trong bồn nước thay vì đo độ ẩm đất."
    }
  },

  // Group 0008_82: VILTRUMITE (Voice AI Mock Interview)
  {
    id: "viol_0008_1",
    case_id: "0008_82",
    audit_round: 1,
    indicator_id: "ind_target_generic_student",
    field_code: "target_customer",
    severity: "MAJOR",
    evidence: {
      quoted_text: "Sinh viên năm 3, năm 4 tất cả các ngành tại Việt Nam cần chuẩn bị phỏng vấn tuyển dụng.",
      analysis: "Tệp quá rộng. Kịch bản phỏng vấn kỹ thuật của sinh viên IT khác hoàn toàn phỏng vấn hành vi của sinh viên kinh tế.",
      recommended_action: "Khóa vào sinh viên IT năm cuối chuẩn bị phỏng vấn vị trí Backend/Frontend tại TP.HCM."
    }
  },

  // Group 0009_201: SMART MEAL (Trợ lý dinh dưỡng cá nhân hóa)
  {
    id: "viol_0009_1",
    case_id: "0009_201",
    audit_round: 1,
    indicator_id: "ind_logic_illogical_financial_claim",
    field_code: "revenue_model",
    severity: "BLOCKER",
    evidence: {
      quoted_text: "USP của app là giúp quản lý tài chính bằng cách so sánh chi phí nấu nguyên liệu thừa trong tủ lạnh với giá mua món đó ở ngoài tiệm.",
      analysis: "Đồ thừa trong tủ lạnh còn cái gì gom vào nấu rồi lại đi so sánh với giá mua ngoài tiệm để bảo tiết kiệm. Lập luận vô lý và tào lao, không phản ánh quản lý tài chính.",
      recommended_action: "Bỏ hoàn toàn tính năng so sánh giá đồ thừa; chuyển sang cá nhân hóa dinh dưỡng theo thể trạng và lọc món ăn theo dị ứng."
    }
  },
  {
    id: "viol_0009_2",
    case_id: "0009_201",
    audit_round: 1,
    indicator_id: "ind_no_moat_chatgpt_wrapper",
    field_code: "value_proposition",
    severity: "BLOCKER",
    evidence: {
      quoted_text: "Người dùng nhập các nguyên liệu sẵn có vào app để AI đề xuất công thức món ăn.",
      analysis: "Hỏi trực tiếp ChatGPT hay Gemini trả về kết quả còn nhanh và chi tiết hơn. Ứng dụng không có USP để người dùng phải tải và sử dụng.",
      recommended_action: "Xây dựng USP SmartMeal = Gợi ý món + Hồ sơ dinh dưỡng theo bệnh lý (tiểu đường, mỡ máu, gút) + Affiliate mua nguyên liệu trên sàn TMĐT."
    }
  },

  // Group 0010_189: FLUNCH (Giao cơm ký túc xá)
  {
    id: "viol_0010_1",
    case_id: "0010_189",
    audit_round: 1,
    indicator_id: "ind_unit_economics_negative",
    field_code: "unit_economics",
    severity: "BLOCKER",
    evidence: {
      quoted_text: "Suất ăn giá 25.000đ - 30.000đ, miễn phí giao hàng tận phòng ký túc xá cho sinh viên trong 15 phút.",
      analysis: "Lợi nhuận gộp trên một suất ăn chỉ 2.000đ - 3.000đ nhưng chi phí shipper nội bộ và hao hụt vượt quá 5.000đ/đơn. Càng bán nhiều càng lỗ nặng.",
      recommended_action: "Áp dụng Batch Delivery: Gom đơn giao theo 2 khung giờ cố định (11h30 và 12h15) tại sảnh tầng 1, thu phí dịch vụ 2.000đ/đơn."
    }
  },

  // Group 0011_106: WAYVEE (Lập kế hoạch du lịch tự túc)
  {
    id: "viol_0011_1",
    case_id: "0011_106",
    audit_round: 1,
    indicator_id: "ind_target_customer_unfocused_dual",
    field_code: "target_customer",
    severity: "BLOCKER",
    evidence: {
      quoted_text: "Khách hàng mục tiêu là sinh viên đại học năm 2 đến năm cuối và người trẻ mới đi làm tại TP.HCM, Hà Nội (18-28 tuổi).",
      analysis: "Gộp 2 nhóm có ngân sách, thời gian và kỳ vọng hoàn toàn khác nhau. Sinh viên nhạy cảm giá, người đi làm cần tối ưu thời gian nghỉ phép ngắn ngày.",
      recommended_action: "Chọn một nhóm duy nhất làm beachhead: Sinh viên năm 2-4 tại TP.HCM đi nhóm 3-5 người, ngân sách 1-3 triệu/chuyến."
    }
  },
  {
    id: "viol_0011_2",
    case_id: "0011_106",
    audit_round: 1,
    indicator_id: "ind_partner_mixed_with_datasource",
    field_code: "revenue_model",
    severity: "BLOCKER",
    evidence: {
      quoted_text: "Đối tác của WAYVEE bao gồm Google Maps, TikTok, Google Search, nhà hàng, khách sạn và đơn vị ưu đãi.",
      analysis: "Google Maps, TikTok chỉ là nguồn dữ liệu công khai (Data Source), không phải đối tác kinh doanh (Partner). Startup chưa có quan hệ đối tác hay API ký kết.",
      recommended_action: "Tách bạch rõ ràng: Nguồn dữ liệu là Google Maps/TikTok; Đối tác giai đoạn đầu là CHƯA CÓ, chưa cần thiết ở CP1."
    }
  },
  {
    id: "viol_0011_3",
    case_id: "0011_106",
    audit_round: 1,
    indicator_id: "ind_value_prop_unsupported_time_claim",
    field_code: "value_proposition",
    severity: "MAJOR",
    evidence: {
      quoted_text: "WAYVEE giúp giảm thời gian lập lịch trình từ vài giờ/vài ngày xuống chỉ còn 10-15 phút.",
      analysis: "Tuyên bố giá trị lớn nhưng hoàn toàn chưa có dữ liệu đo lường hay bài test đối chứng thực tế.",
      recommended_action: "Thực hiện Concierge MVP cho 10-15 người có chuyến đi thật và đo thời gian thực tế họ cần để duyệt bản lịch trình Notion."
    }
  },
  {
    id: "viol_0011_4",
    case_id: "0011_106",
    audit_round: 1,
    indicator_id: "ind_success_metrics_self_reported",
    field_code: "evidence_validation",
    severity: "MAJOR",
    evidence: {
      quoted_text: "Tiêu chí thành công của dự án là 70% người dùng cảm thấy ứng dụng hữu ích và sẵn sàng tiếp tục sử dụng.",
      analysis: "Tiêu chí chỉ dựa trên tự báo cáo cảm nhận qua khảo sát, không chứng minh được sự thay đổi hành vi thực tế.",
      recommended_action: "Bổ sung chỉ số hành vi thực tế: số người gửi form cho chuyến đi thật, số người yêu cầu lịch trình lần 2 hoặc sẵn sàng trả 20k-50k."
    }
  },

  // Group 0012_187: HANDS-FREE / HF APP (Việc làm thời vụ)
  {
    id: "viol_0012_1",
    case_id: "0012_187",
    audit_round: 1,
    indicator_id: "ind_escrow_p2p_legal_trust_crash",
    field_code: "revenue_model",
    severity: "BLOCKER",
    evidence: {
      quoted_text: "Tạo nền tảng giữ tiền trung gian (Escrow), yêu cầu cô Nga (chủ sạp) chuyển tiền công vào app HF giữ trước, sinh viên làm xong mới giải ngân.",
      analysis: "Không có cơ sở pháp lý và uy tín để tiểu thương giao tiền cho app sinh viên giữ. Khách hàng sợ startup ôm tiền cọc bỏ trốn hơn là sợ người làm bùng việc.",
      recommended_action: "Chuyển sang mô hình Matching Fee (phí kết nối 10.000đ - 20.000đ/lượt ghép thành công), tuyệt đối không đụng vào dòng tiền lương của người lao động."
    }
  },
  {
    id: "viol_0012_2",
    case_id: "0012_187",
    audit_round: 1,
    indicator_id: "ind_touching_salary_flow",
    field_code: "revenue_model",
    severity: "BLOCKER",
    evidence: {
      quoted_text: "Nền tảng đứng ra quản lý toàn bộ tiền lương của sinh viên làm thời vụ và trích hoa hồng trước khi giải ngân.",
      analysis: "Đụng vào dòng tiền lương khi chưa có giấy phép tài chính/ví điện tử là vi phạm pháp luật và tạo rào cản niềm tin khổng lồ.",
      recommended_action: "Hai bên tự thanh toán lương trực tiếp; app chỉ cung cấp dịch vụ thông tin và kết nối ứng viên."
    }
  },
  {
    id: "viol_0012_3",
    case_id: "0012_187",
    audit_round: 1,
    indicator_id: "ind_team_superficial_rote_reading",
    field_code: "team_structure",
    severity: "MAJOR",
    evidence: {
      quoted_text: "Đội ngũ Autonomous Execution Team gồm 2 Graphic Designers và 2 Software Engineers.",
      analysis: "Cơ cấu trên giấy tốt nhưng thực tế thuyết trình cầm điện thoại đọc như trả bài, làm việc đối phó và không thấu hiểu dự án.",
      recommended_action: "Chấn chỉnh tác phong làm việc nhóm, phân công lại vai trò và thấu hiểu sâu sắc hành vi của khách hàng thực địa."
    }
  }
];

const insertViolation = db.prepare(`
  INSERT INTO case_audit_violations (id, case_id, audit_round, indicator_id, field_code, severity, evidence)
  VALUES ($id, $case_id, $audit_round, $indicator_id, $field_code, $severity, $evidence)
`);

for (const v of violationsData) {
  insertViolation.run({
    $id: v.id,
    $case_id: v.case_id,
    $audit_round: v.audit_round,
    $indicator_id: v.indicator_id,
    $field_code: v.field_code,
    $severity: v.severity,
    $evidence: JSON.stringify(v.evidence),
  });
}

// ============================================================================
// 5. XUẤT RA STARTUP_KNOWLEDGE.JSON ĐỒNG BỘ
// ============================================================================

const criteriaRows = db.query(`SELECT * FROM evaluation_criteria ORDER BY weight DESC, id ASC`).all();
const indicatorsRows = db.query(`
  SELECT i.*, c.name as criteria_name, c.field_code
  FROM evaluation_indicators i
  JOIN evaluation_criteria c ON i.criteria_id = c.id
  ORDER BY i.severity ASC, i.code ASC
`).all().map((r) => {
  const row = r as Record<string, unknown>;
  return {
    ...row,
    rule_data: typeof row.rule_data === "string" ? JSON.parse(row.rule_data) : row.rule_data
  };
});

const violationsRows = db.query(`
  SELECT v.*, i.code as indicator_code, i.title as indicator_title
  FROM case_audit_violations v
  JOIN evaluation_indicators i ON v.indicator_id = i.id
  ORDER BY v.case_id ASC, v.id ASC
`).all().map((r) => {
  const row = r as Record<string, unknown>;
  return {
    ...row,
    evidence: typeof row.evidence === "string" ? JSON.parse(row.evidence) : row.evidence
  };
});

const exportPayload = {
  version: "2.0.0",
  last_updated: new Date().toISOString(),
  description: "Cơ sở tri thức thẩm định ý tưởng khởi nghiệp Checkpoint 1 (Strong Spine, Flexible Ribs)",
  summary: {
    total_criteria: criteriaRows.length,
    total_indicators: indicatorsRows.length,
    total_case_violations: violationsRows.length,
    covered_groups: ["0001_26", "0002_155", "0003_122", "0004_133", "0005_42", "0006_47", "0007_221", "0008_82", "0009_201", "0010_189", "0011_106", "0012_187"]
  },
  evaluation_criteria: criteriaRows,
  evaluation_indicators: indicatorsRows,
  case_audit_violations: violationsRows
};

writeFileSync(jsonPath, JSON.stringify(exportPayload, null, 2), "utf-8");

console.log("==========================================================");
console.log("✅ BIÊN DỊCH CƠ SỞ TRI THỨC STARTUP THÀNH CÔNG!");
console.log(`- SQLite Database: ${dbPath}`);
console.log(`- JSON Export:     ${jsonPath}`);
console.log(`- Tiêu chí:        ${criteriaRows.length} criteria`);
console.log(`- Chỉ báo bẫy lỗi: ${indicatorsRows.length} indicators`);
console.log(`- Hồ sơ vi phạm:   ${violationsRows.length} case violations across 12 groups`);
console.log("==========================================================");
