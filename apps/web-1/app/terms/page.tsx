import type { Metadata } from "next";
import { Title } from "@mantine/core";
import PolicyDocumentLayout, {
  type TOCItem,
} from "@/components/policy/PolicyDocumentLayout";

export const metadata: Metadata = {
  title: "Điều khoản dịch vụ | Nexus Platform",
  description:
    "Quy định điều khoản sử dụng dịch vụ, quyền sở hữu trí tuệ, chuẩn mực liêm chính học thuật và trách nhiệm pháp lý của Nexus Platform.",
};

const termsTOC: TOCItem[] = [
  { id: "dieu-1-gioi-thieu", title: "1. Giới thiệu & Thỏa thuận sử dụng" },
  { id: "dieu-2-dinh-nghia", title: "2. Định nghĩa thuật ngữ" },
  { id: "dieu-3-tai-khoan", title: "3. Tài khoản & Trách nhiệm bảo mật" },
  { id: "dieu-4-so-huu-tri-tue", title: "4. Quyền sở hữu trí tuệ (IP)" },
  { id: "dieu-5-liem-chinh-hoc-thuat", title: "5. Chuẩn mực liêm chính học thuật" },
  { id: "dieu-6-thanh-toan-va-vi", title: "6. Dịch vụ, Ví & Tín dụng (Credit)" },
  { id: "dieu-7-hoan-tien", title: "7. Chính sách hoàn tiền & Hủy bỏ" },
  { id: "dieu-8-hanh-vi-cam", title: "8. Quy tắc ứng xử & Hành vi bị cấm" },
  { id: "dieu-9-gioi-han-trach-nhiem", title: "9. Từ chối bảo đảm & Giới hạn trách nhiệm" },
  { id: "dieu-10-giai-quyet-tranh-chap", title: "10. Luật điều chỉnh & Giải quyết tranh chấp" },
];

export default function TermsPage() {
  return (
    <PolicyDocumentLayout
      title="Điều khoản Sử dụng Dịch vụ (Terms of Service)"
      subtitle="Văn bản này cấu thành một thỏa thuận pháp lý ràng buộc giữa bạn và Nexus Platform. Vui lòng đọc kỹ trước khi truy cập hoặc sử dụng các dịch vụ của chúng tôi."
      effectiveDate="30/08/2026"
      version="2026-08-v2.0"
      tocItems={termsTOC}
    >
      <div className="space-y-10">
        {/* ── Điều 1 ── */}
        <section id="dieu-1-gioi-thieu" className="scroll-mt-24 space-y-4">
          <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
            1. Giới thiệu & Thỏa thuận sử dụng
          </Title>
          <p className="text-text-muted leading-relaxed">
            Chào mừng bạn đến với <strong>Nexus Platform</strong> ("Nexus", "Nền tảng", "Chúng tôi"). Nexus là một nền tảng giáo dục công nghệ (EdTech) cung cấp giải pháp hỗ trợ cấu trúc hóa ý tưởng, phản biện tài liệu khởi nghiệp và nâng cao năng lực hoàn thiện hồ sơ dự án cho sinh viên.
          </p>
          <p className="text-text-muted leading-relaxed">
            Bằng việc nhấp vào nút "Đăng ký", "Tôi đồng ý", hoặc bằng việc truy cập, duyệt web, và sử dụng bất kỳ dịch vụ nào do Nexus cung cấp, bạn (người dùng) xác nhận rằng bạn đã đủ năng lực hành vi dân sự, đã đọc, hiểu rõ, và đồng ý bị ràng buộc bởi toàn bộ nội dung của Điều khoản Dịch vụ này cùng với <strong>Chính sách Bảo mật</strong> của chúng tôi. Nếu bạn không đồng ý với bất kỳ phần nào của thỏa thuận này, bạn không được phép sử dụng dịch vụ của Nexus.
          </p>
        </section>

        {/* ── Điều 2 ── */}
        <section id="dieu-2-dinh-nghia" className="scroll-mt-24 space-y-4">
          <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
            2. Định nghĩa thuật ngữ
          </Title>
          <div className="space-y-3 text-text-muted">
            <p>
              <strong className="text-text-main">Người dùng (User / Sinh viên):</strong> Bất kỳ cá nhân hoặc tổ chức nào tạo tài khoản và sử dụng dịch vụ của Nexus Platform để nhận tư vấn, đánh giá hoặc quản lý dự án.
            </p>
            <p>
              <strong className="text-text-main">Hồ sơ hỗ trợ (Case):</strong> Không gian làm việc kỹ thuật số khép kín được tạo ra cho một dự án hoặc yêu cầu cụ thể, dùng để lưu trữ tài liệu, trao đổi thông tin và phân phối báo cáo kết quả.
            </p>
            <p>
              <strong className="text-text-main">Người hỗ trợ chuyên môn (Supporter):</strong> Đội ngũ chuyên gia, cố vấn hoặc cá nhân có năng lực chuyên môn được Nexus ủy quyền để tiếp nhận case, phân tích tài liệu, và cung cấp phản biện cho Người dùng.
            </p>
            <p>
              <strong className="text-text-main">Dịch vụ (Services):</strong> Bao gồm quyền truy cập phần mềm nền tảng web, các công cụ phân tích bằng Trí tuệ Nhân tạo (AI), hệ thống thanh toán, dịch vụ cố vấn trực tiếp hoặc bất kỳ sản phẩm nào khác do Nexus cung cấp.
            </p>
          </div>
        </section>

        {/* ── Điều 3 ── */}
        <section id="dieu-3-tai-khoan" className="scroll-mt-24 space-y-4">
          <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
            3. Tài khoản & Trách nhiệm bảo mật
          </Title>
          <div className="space-y-3 text-text-muted">
            <p>
              <strong className="text-text-main">3.1. Đăng ký tài khoản:</strong> Để sử dụng dịch vụ, bạn phải đăng ký tài khoản và cung cấp thông tin chính xác, đầy đủ, và cập nhật. Việc sử dụng danh tính giả mạo là vi phạm nghiêm trọng Điều khoản này.
            </p>
            <p>
              <strong className="text-text-main">3.2. Trách nhiệm bảo mật:</strong> Bạn hoàn toàn chịu trách nhiệm duy trì tính bảo mật của thông tin đăng nhập (email, mật khẩu). Nexus sẽ không chịu trách nhiệm cho bất kỳ tổn thất hay thiệt hại nào phát sinh từ việc bạn không bảo vệ được thông tin tài khoản của mình. Mọi hoạt động diễn ra dưới tài khoản của bạn sẽ được coi là do bạn thực hiện hoặc ủy quyền.
            </p>
            <p>
              <strong className="text-text-main">3.3. Sử dụng cá nhân:</strong> Tài khoản là định danh cá nhân. Bạn không được phép chuyển nhượng, cho thuê, hoặc chia sẻ quyền truy cập tài khoản của mình cho bất kỳ bên thứ ba nào.
            </p>
          </div>
        </section>

        {/* ── Điều 4 ── */}
        <section id="dieu-4-so-huu-tri-tue" className="scroll-mt-24 space-y-4">
          <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
            4. Quyền Sở hữu Trí tuệ (Intellectual Property Rights)
          </Title>
          <div className="space-y-3 pl-4 border-l-2 border-brand text-text-muted">
            <p>
              <strong className="text-text-main">4.1. Tài sản của Người dùng (User Content):</strong> Bạn duy trì toàn quyền sở hữu, tác quyền và quyền sở hữu trí tuệ đối với mọi nội dung do bạn tải lên hệ thống (bao gồm ý tưởng kinh doanh, pitch deck, báo cáo, mã nguồn, bảng tính). 
            </p>
            <p>
              <strong className="text-text-main">4.2. Giấy phép sử dụng hạn chế cấp cho Nexus:</strong> Bằng việc tải tài liệu lên hệ thống, bạn chỉ cấp cho Nexus một giấy phép giới hạn, không độc quyền, có thể thu hồi, nhằm mục đích duy nhất là phân tích, lưu trữ và hiển thị nội dung đó để cung cấp dịch vụ phản biện (bao gồm việc xử lý qua các mô hình AI tích hợp của chúng tôi).
            </p>
            <p>
              <strong className="text-text-main">4.3. Cam kết bảo vệ tính nguyên bản (NDA):</strong> Nexus và đội ngũ Supporter cam kết tuân thủ nguyên tắc bảo mật. Chúng tôi KHÔNG sao chép, tái sử dụng, bán, hoặc dùng ý tưởng của bạn để huấn luyện (train) các mô hình ngôn ngữ lớn (LLM) công khai của bên thứ ba.
            </p>
            <p>
              <strong className="text-text-main">4.4. Tài sản của Nexus:</strong> Bản thân Nền tảng, bao gồm mã nguồn, thuật toán, giao diện người dùng, logo, và các báo cáo đánh giá (format và cấu trúc) đều là tài sản trí tuệ độc quyền của Nexus Platform. Bạn không được phép sao chép, dịch ngược (reverse-engineer) hoặc tạo sản phẩm phái sinh từ Nền tảng.
            </p>
          </div>
        </section>

        {/* ── Điều 5 ── */}
        <section id="dieu-5-liem-chinh-hoc-thuat" className="scroll-mt-24 space-y-4">
          <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
            5. Chuẩn mực Liêm chính Học thuật
          </Title>
          <p className="text-text-muted leading-relaxed">
            Nexus duy trì lập trường không khoan nhượng đối với hành vi gian lận học thuật. Dịch vụ của chúng tôi mang tính chất <strong>Cố vấn & Đánh giá (Coaching & Advisory)</strong>, tuyệt đối không phải là dịch vụ làm thuê hay học thay.
          </p>
          <div className="space-y-3 pl-4 border-l-2 border-border-app text-text-muted">
            <p><strong className="text-text-main">Giới hạn can thiệp:</strong> Supporter và công cụ AI của Nexus sẽ chỉ ra các lỗ hổng logic, lỗi cấu trúc, tính khả thi của dự án và gợi ý hướng cải thiện. Sinh viên bắt buộc phải là người tự nghiên cứu, đưa ra quyết định và tự tay hoàn thiện sản phẩm cuối cùng.</p>
            <p><strong className="text-text-main">Không cam kết kết quả đánh giá cuối cùng:</strong> Nexus không đảm bảo, không hứa hẹn bất kỳ mức điểm số, giải thưởng hay sự chấp thuận nào từ phía trường đại học, ban giám khảo hay nhà đầu tư.</p>
            <p><strong className="text-text-main">Trách nhiệm cá nhân:</strong> Sinh viên chịu trách nhiệm 100% đối với sản phẩm nộp cho cơ sở giáo dục, đảm bảo không vi phạm quy chế đạo văn (plagiarism) hay các chính sách học thuật của nhà trường.</p>
          </div>
        </section>

        {/* ── Điều 6 ── */}
        <section id="dieu-6-thanh-toan-va-vi" className="scroll-mt-24 space-y-4">
          <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
            6. Dịch vụ, Ví & Tín dụng (Credit)
          </Title>
          <div className="space-y-3 text-text-muted">
            <p>
              <strong className="text-text-main">6.1. Đơn vị tiền tệ và Ví VND:</strong> Mọi giao dịch nạp tiền được xử lý bằng Việt Nam Đồng (VND) thông qua các cổng thanh toán hợp pháp (VD: SePay, VietQR). Số dư trong ví VND không có thời hạn hết hạn.
            </p>
            <p>
              <strong className="text-text-main">6.2. Credit (Lượt đánh giá):</strong> Dịch vụ phản biện được thanh toán thông qua Credit hoặc trừ trực tiếp từ Ví VND. Credit đã mua có thời hạn sử dụng quy định tại thời điểm mua (mặc định 12 tháng nếu không có ghi chú khác).
            </p>
            <p>
              <strong className="text-text-main">6.3. Khấu trừ:</strong> Hệ thống chỉ chính thức khấu trừ Credit hoặc tiền trong Ví khi báo cáo đánh giá đã được Supporter hoàn thiện và xuất bản thành công (trạng thái "Report Ready").
            </p>
          </div>
        </section>

        {/* ── Điều 7 ── */}
        <section id="dieu-7-hoan-tien" className="scroll-mt-24 space-y-4">
          <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
            7. Chính sách Hoàn tiền & Hủy bỏ
          </Title>
          <div className="space-y-3 text-text-muted">
            <p>
              <strong className="text-text-main">Hoàn tiền 100% tự động:</strong> Trong trường hợp Quản trị viên (Admin) hoặc Supporter từ chối (Veto) yêu cầu hỗ trợ do không đủ dữ liệu, vượt quá phạm vi chuyên môn, hoặc hệ thống quá tải vi phạm SLA (Cam kết thời gian dịch vụ), 100% số tiền/Credit sẽ được hoàn trả lập tức vào Ví của người dùng.
            </p>
            <p>
              <strong className="text-text-main">Người dùng chủ động hủy:</strong> Nếu bạn hủy Case trước khi Supporter bắt đầu quá trình đánh giá (trạng thái <code>pending</code> hoặc <code>assigned</code>), hệ thống sẽ hoàn trả 100%. Nếu Case đang trong quá trình thực hiện (<code>in_progress</code>), việc hoàn tiền sẽ do Admin quyết định tùy thuộc vào khối lượng công việc đã hoàn thành. KHÔNG hoàn tiền khi báo cáo đã được xuất bản (<code>completed</code>).
            </p>
            <p>
              <strong className="text-text-main">Rút tiền mặt (Withdrawal):</strong> Số dư Ví VND có thể được yêu cầu rút về tài khoản ngân hàng chính chủ. Quá trình đối soát và giải ngân có thể mất từ 3-7 ngày làm việc và có thể chịu phí giao dịch của bên thứ ba. Credit khuyến mãi hoặc được tặng thưởng không có giá trị quy đổi thành tiền mặt.
            </p>
          </div>
        </section>

        {/* ── Điều 8 ── */}
        <section id="dieu-8-hanh-vi-cam" className="scroll-mt-24 space-y-4">
          <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
            8. Quy tắc ứng xử & Hành vi bị cấm (Acceptable Use Policy)
          </Title>
          <p className="text-text-muted leading-relaxed">
            Bạn đồng ý KHÔNG thực hiện hoặc cố gắng thực hiện bất kỳ hành vi nào sau đây:
          </p>
          <div className="space-y-3 pl-4 border-l-2 border-border-app text-text-muted">
            <p>Sử dụng nền tảng cho mục đích bất hợp pháp, lừa đảo, hoặc vi phạm pháp luật hiện hành.</p>
            <p>Tải lên nội dung chứa mã độc, virus, trojan, hoặc can thiệp vào hoạt động bình thường của hệ thống.</p>
            <p>Có hành vi quấy rối, xúc phạm, phân biệt đối xử, hoặc sử dụng ngôn từ kích động thù địch đối với Supporter hoặc người dùng khác.</p>
            <p>Thực hiện các phương thức tự động (bot, scraper, spider) để thu thập trái phép dữ liệu từ nền tảng.</p>
            <p>Lạm dụng các chính sách dùng thử, gói miễn phí bằng cách tạo hàng loạt tài khoản giả mạo (sybil attack).</p>
          </div>
          <p className="text-text-muted font-medium mt-4">
            Nexus bảo lưu quyền đơn phương từ chối dịch vụ, đóng băng tài khoản hoặc chấm dứt vĩnh viễn quyền truy cập của bạn mà không cần thông báo trước nếu phát hiện vi phạm nghiêm trọng các quy định này.
          </p>
        </section>

        {/* ── Điều 9 ── */}
        <section id="dieu-9-gioi-han-trach-nhiem" className="scroll-mt-24 space-y-4">
          <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
            9. Từ chối bảo đảm & Giới hạn trách nhiệm
          </Title>
          <div className="space-y-3 text-text-muted">
            <p>
              <strong className="text-text-main">9.1. Từ chối bảo đảm (As Is):</strong> Các dịch vụ của Nexus được cung cấp theo nguyên trạng ("AS IS") và theo tình trạng sẵn có ("AS AVAILABLE"). Chúng tôi từ chối mọi bảo đảm, dù rõ ràng hay ngụ ý, bao gồm nhưng không giới hạn ở tính thương mại, sự phù hợp cho một mục đích cụ thể, và việc không vi phạm.
            </p>
            <p>
              <strong className="text-text-main">9.2. Giới hạn trách nhiệm (Limitation of Liability):</strong> Trong phạm vi tối đa được pháp luật cho phép, Nexus, các giám đốc, nhân viên, hoặc đối tác sẽ không chịu trách nhiệm cho bất kỳ thiệt hại gián tiếp, ngẫu nhiên, đặc biệt, mang tính hệ quả hoặc thiệt hại do mất dữ liệu, mất doanh thu, hoặc uy tín học thuật phát sinh từ việc bạn sử dụng hoặc không thể sử dụng dịch vụ.
            </p>
            <p>
              <strong className="text-text-main">9.3. Mức trần bồi thường:</strong> Bất chấp mọi quy định khác, tổng trách nhiệm pháp lý của Nexus đối với bất kỳ khiếu nại nào (dù trong hợp đồng hay ngoài hợp đồng) sẽ KHÔNG vượt quá tổng số tiền bạn đã thanh toán thực tế cho Nexus cho dịch vụ cụ thể gây ra khiếu nại đó trong sáu (06) tháng gần nhất.
            </p>
          </div>
        </section>

        {/* ── Điều 10 ── */}
        <section id="dieu-10-giai-quyet-tranh-chap" className="scroll-mt-24 space-y-4">
          <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
            10. Luật điều chỉnh & Giải quyết tranh chấp
          </Title>
          <div className="space-y-3 text-text-muted">
            <p>
              <strong className="text-text-main">10.1. Cập nhật điều khoản:</strong> Nexus bảo lưu quyền sửa đổi, bổ sung Điều khoản này vào bất kỳ lúc nào. Những thay đổi sẽ có hiệu lực ngay khi được đăng tải. Việc bạn tiếp tục sử dụng dịch vụ sau khi các thay đổi được công bố đồng nghĩa với việc bạn chấp nhận các điều khoản sửa đổi.
            </p>
            <p>
              <strong className="text-text-main">10.2. Giải quyết tranh chấp:</strong> Mọi tranh chấp, bất đồng phát sinh từ hoặc liên quan đến thỏa thuận này sẽ được ưu tiên giải quyết thông qua thương lượng thiện chí giữa các bên. Nếu không đạt được thỏa thuận trong vòng ba mươi (30) ngày, tranh chấp sẽ được đệ trình giải quyết cuối cùng tại Tòa án nhân dân có thẩm quyền tại Thành phố Hồ Chí Minh, Việt Nam.
            </p>
            <p>
              <strong className="text-text-main">10.3. Luật áp dụng:</strong> Thỏa thuận này được điều chỉnh và giải thích theo luật pháp của nước Cộng hòa Xã hội Chủ nghĩa Việt Nam.
            </p>
          </div>
        </section>
      </div>
    </PolicyDocumentLayout>
  );
}
