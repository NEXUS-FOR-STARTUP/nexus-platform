import type { Metadata } from "next";
import { Title } from "@mantine/core";
import PolicyDocumentLayout, {
  type TOCItem,
} from "@/components/policy/PolicyDocumentLayout";

export const metadata: Metadata = {
  title: "Chính sách Vận hành & Sử dụng Công bằng | Nexus Platform",
  description:
    "Quy chế hoạt động, giới hạn gói miễn phí (Fair Use), chuẩn hóa lý do đóng hồ sơ và cam kết chất lượng dịch vụ (SLA) của Nexus Platform.",
};

const fairUseTOC: TOCItem[] = [
  { id: "dieu-1-muc-dich", title: "1. Mục đích & Tiêu chuẩn hoạt động" },
  { id: "dieu-2-fair-use", title: "2. Chính sách Sử dụng Công bằng (Fair Use)" },
  { id: "dieu-3-chong-lam-dung", title: "3. Phòng chống lạm dụng & Spam API" },
  { id: "dieu-4-dong-ho-so", title: "4. Chuẩn hóa lý do Đóng/Từ chối Hồ sơ" },
  { id: "dieu-5-cam-ket-sla", title: "5. Cam kết Chất lượng & Auto-Priority" },
  { id: "dieu-6-che-tai", title: "6. Chế tài xử lý vi phạm" },
];

export default function FairUsePolicyPage() {
  return (
    <PolicyDocumentLayout
      title="Chính sách Vận hành & Sử dụng Công bằng"
      subtitle="Tài liệu này xác định các ranh giới vận hành, nguyên tắc phân bổ tài nguyên hệ thống và tiêu chuẩn đánh giá hồ sơ nhằm duy trì một nền tảng khởi nghiệp minh bạch, chất lượng."
      effectiveDate="30/08/2026"
      version="2026-08-v2.0"
      tocItems={fairUseTOC}
    >
      <div className="space-y-10">
        {/* ── Điều 1 ── */}
        <section id="dieu-1-muc-dich" className="scroll-mt-24 space-y-4">
          <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
            1. Mục đích & Tiêu chuẩn hoạt động
          </Title>
          <p className="text-text-muted leading-relaxed">
            Nexus Platform vận hành dựa trên sự kết hợp giữa Trí tuệ Nhân tạo (AI Engine) và Đội ngũ Cố vấn chuyên môn (Human Supporters). Để đảm bảo tính bền vững của hạ tầng và cam kết chất lượng phản biện cao nhất cho mọi sinh viên, chúng tôi thiết lập Chính sách Vận hành & Sử dụng Công bằng (Acceptable & Fair Use Policy) này. Mọi hành vi làm cạn kiệt tài nguyên có chủ đích hoặc sử dụng nền tảng sai mục đích đều bị nghiêm cấm.
          </p>
        </section>

        {/* ── Điều 2 ── */}
        <section id="dieu-2-fair-use" className="scroll-mt-24 space-y-4">
          <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
            2. Chính sách Sử dụng Công bằng (Fair Use) đối với Gói Miễn phí
          </Title>
          <div className="space-y-3 text-text-muted">
            <p>
              <strong className="text-text-main">2.1. Bản chất của Gói Free:</strong> Gói Đánh giá mức độ phù hợp Nhóm - Ý tưởng (Team-Idea Fit) được cung cấp miễn phí nhằm hỗ trợ sinh viên trải nghiệm phương pháp luận của Nexus trước khi đi sâu vào phát triển dự án thực tế.
            </p>
            <p>
              <strong className="text-text-main">2.2. Hạn mức phần mềm:</strong> Mỗi tài khoản định danh hợp lệ chỉ được phép khởi tạo tối đa <strong>ba (03) hồ sơ miễn phí</strong> trong toàn bộ vòng đời của tài khoản.
            </p>
            <p>
              <strong className="text-text-main">2.3. Vượt hạn mức:</strong> Khi sử dụng hết hạn mức, tính năng tạo hồ sơ miễn phí sẽ tự động bị khóa. Sinh viên cần nâng cấp lên các gói phân tích chuyên sâu (Paid Packages) để tiếp tục sử dụng sức mạnh tính toán của mô hình ngôn ngữ lớn (LLM).
            </p>
          </div>
        </section>

        {/* ── Điều 3 ── */}
        <section id="dieu-3-chong-lam-dung" className="scroll-mt-24 space-y-4">
          <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
            3. Phòng chống lạm dụng & Spam API (Anti-Abuse Restrictions)
          </Title>
          <p className="text-text-muted leading-relaxed">
            Hạ tầng phân tích của chúng tôi phải trả phí trên mỗi truy vấn API (Token) cho OpenAI và Google. Do đó, các hành vi sau bị cấm tuyệt đối:
          </p>
          <div className="space-y-3 pl-4 border-l-2 border-brand text-text-muted">
            <p><strong>Tấn công Sybil:</strong> Cố tình tạo hàng loạt tài khoản email giả, tài khoản ảo (clone) nhằm vượt qua giới hạn 3 lần miễn phí.</p>
            <p><strong>Tấn công tự động (Automation Abuse):</strong> Sử dụng phần mềm cào dữ liệu (scrapers), bot, hoặc kịch bản tự động để liên tục gửi các biểu mẫu, hồ sơ rác làm tắc nghẽn hàng đợi của hệ thống.</p>
            <p><strong>Prompt Injection:</strong> Cố ý nhập các đoạn mã, câu lệnh thao túng nhằm điều hướng AI của Nexus tạo ra các nội dung độc hại, lách luật hoặc truy xuất thông tin hệ thống.</p>
          </div>
        </section>

        {/* ── Điều 4 ── */}
        <section id="dieu-4-dong-ho-so" className="scroll-mt-24 space-y-4">
          <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
            4. Chuẩn hóa lý do Đóng / Từ chối Hồ sơ (Case Closure Taxonomy)
          </Title>
          <p className="text-text-muted leading-relaxed">
            Để bảo vệ chất lượng dịch vụ, Quản trị viên (Admin) và Cố vấn (Supporter) có quyền từ chối tiếp nhận hoặc đóng hồ sơ của bạn với một trong các mã lý do minh bạch sau:
          </p>
          <div className="space-y-3 text-text-muted">
            <p><strong className="text-text-main">INACTIVE_TIMEOUT (Đóng do bỏ cuộc):</strong> Bạn không phản hồi hoặc không nộp bổ sung tài liệu theo yêu cầu của Supporter sau 14 ngày liên tục.</p>
            <p><strong className="text-text-main">DUPLICATE_CASE (Hồ sơ trùng lặp):</strong> Gửi nhiều hồ sơ cho cùng một nội dung dự án. Hồ sơ phụ sẽ bị đóng và hoàn tiền.</p>
            <p><strong className="text-text-main">INSUFFICIENT_DATA (Dữ liệu sơ sài):</strong> Hồ sơ trống rỗng, không chứa dữ kiện cốt lõi về dự án và không được cải thiện dù đã nhắc nhở 2 lần.</p>
            <p><strong className="text-text-main">OUT_OF_SCOPE (Ngoài phạm vi cố vấn):</strong> Đề tài vi phạm pháp luật, thuần túy là yêu cầu "giải bài tập hộ", hoặc nằm ngoài chuyên môn khởi nghiệp của đội ngũ.</p>
            <p><strong className="text-text-main">VIOLATION_POLICY (Vi phạm nghiêm trọng):</strong> Gian lận đạo văn, xúc phạm Supporter. Hành vi này dẫn đến đóng hồ sơ KHÔNG hoàn tiền.</p>
          </div>
        </section>

        {/* ── Điều 5 ── */}
        <section id="dieu-5-cam-ket-sla" className="scroll-mt-24 space-y-4">
          <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
            5. Cam kết Chất lượng & Phân luồng Ưu tiên (SLA & Auto-Priority)
          </Title>
          <div className="space-y-3 text-text-muted">
            <p>
              <strong className="text-text-main">5.1. Cam kết Thời gian (SLA):</strong> Nexus cam kết thời gian phản hồi tiêu chuẩn là từ 24 - 48 giờ làm việc kể từ lúc Supporter chính thức nhận hồ sơ. Nếu vi phạm SLA (trễ quá 48 giờ) mà không có thông báo chính đáng, bạn sẽ được tự động hoàn tiền 100%.
            </p>
            <p>
              <strong className="text-text-main">5.2. Thuật toán Hàng đợi Thông minh:</strong> Hồ sơ của bạn không chỉ được xếp hàng theo thứ tự thời gian. Nền tảng áp dụng thuật toán chấm điểm ưu tiên (Priority Score) theo thời gian thực dựa trên 4 yếu tố:
              <br/>- Cấp độ gói dịch vụ (Gói trả phí cao được ưu tiên).
              <br/>- Thời gian chờ đợi của bạn.
              <br/>- Mức độ khẩn cấp (Hạn nộp bài trên trường của sinh viên).
              <br/>- Vòng sửa đổi (Các hồ sơ nộp lại bản sửa lỗi được cộng điểm ưu tiên cao để chốt nhanh kết quả).
            </p>
          </div>
        </section>

        {/* ── Điều 6 ── */}
        <section id="dieu-6-che-tai" className="scroll-mt-24 space-y-4">
          <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
            6. Chế tài Xử lý Vi phạm
          </Title>
          <p className="text-text-muted leading-relaxed">
            Việc vi phạm bất kỳ điều khoản nào trong Chính sách Vận hành & Sử dụng Công bằng này sẽ dẫn đến các biện pháp xử lý kỷ luật linh hoạt hoặc lập tức:
          </p>
          <div className="space-y-3 text-text-muted">
            <p><strong>Cấp độ 1:</strong> Gửi email cảnh cáo chính thức và yêu cầu dừng hành vi vi phạm.</p>
            <p><strong>Cấp độ 2:</strong> Hủy bỏ ngay lập tức các hồ sơ đang xử lý (không hoàn tiền) và tạm khóa tính năng nộp bài (Shadow-ban) từ 7 đến 30 ngày.</p>
            <p><strong>Cấp độ 3:</strong> Khóa tài khoản vĩnh viễn, đưa địa chỉ IP/Fingerprint vào danh sách đen (Blacklist) ở cấp độ mạng (WAF) và chặn mọi nỗ lực thanh toán trong tương lai.</p>
          </div>
        </section>
      </div>
    </PolicyDocumentLayout>
  );
}
