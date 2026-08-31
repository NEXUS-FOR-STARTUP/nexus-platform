import type { Metadata } from "next";
import { Title } from "@mantine/core";
import PolicyDocumentLayout, {
  type TOCItem,
} from "@/components/policy/PolicyDocumentLayout";

export const metadata: Metadata = {
  title: "Chính sách bảo mật | Nexus Platform",
  description:
    "Chính sách bảo vệ dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP của Nexus Platform, cam kết bảo vệ thông tin và quyền riêng tư của người dùng.",
};

const privacyTOC: TOCItem[] = [
  { id: "dieu-1-tong-quan", title: "1. Tổng quan & Cam kết tuân thủ" },
  { id: "dieu-2-ben-kiem-soat", title: "2. Bên Kiểm soát và Xử lý dữ liệu" },
  { id: "dieu-3-du-lieu-thu-thap", title: "3. Dữ liệu cá nhân chúng tôi thu thập" },
  { id: "dieu-4-muc-dich-xu-ly", title: "4. Căn cứ & Mục đích xử lý dữ liệu" },
  { id: "dieu-5-chia-se-du-lieu", title: "5. Chia sẻ dữ liệu & Bên thứ ba" },
  { id: "dieu-6-thoi-gian-luu-tru", title: "6. Thời gian lưu trữ dữ liệu" },
  { id: "dieu-7-quyen-chu-the", title: "7. Quyền của Chủ thể dữ liệu" },
  { id: "dieu-8-bao-mat", title: "8. Biện pháp bảo mật & Xử lý sự cố" },
  { id: "dieu-9-quyen-tre-em", title: "9. Quyền riêng tư của trẻ em" },
  { id: "dieu-10-lien-he", title: "10. Cập nhật chính sách & Liên hệ" },
];

export default function PrivacyPage() {
  return (
    <PolicyDocumentLayout
      title="Chính sách Bảo vệ Dữ liệu Cá nhân"
      subtitle="Chính sách này giải thích chi tiết cách Nexus Platform thu thập, xử lý, bảo vệ và chia sẻ thông tin cá nhân của bạn, tuân thủ nghiêm ngặt Nghị định số 13/2023/NĐ-CP."
      effectiveDate="30/08/2026"
      version="2026-08-v2.0"
      tocItems={privacyTOC}
    >
      <div className="space-y-10">
        {/* ── Điều 1 ── */}
        <section id="dieu-1-tong-quan" className="scroll-mt-24 space-y-4">
          <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
            1. Tổng quan & Cam kết tuân thủ
          </Title>
          <p className="text-text-muted leading-relaxed">
            Tại <strong>Nexus Platform</strong>, quyền riêng tư của bạn là ưu tiên hàng đầu. Chúng tôi cam kết xử lý Dữ liệu Cá nhân của bạn một cách an toàn, minh bạch và tuân thủ tuyệt đối các quy định của pháp luật Việt Nam về bảo vệ dữ liệu cá nhân, đặc biệt là <strong>Nghị định 13/2023/NĐ-CP</strong> và các tiêu chuẩn bảo mật quốc tế (như ISO/IEC 27001 và GDPR, nơi áp dụng).
          </p>
        </section>

        {/* ── Điều 2 ── */}
        <section id="dieu-2-ben-kiem-soat" className="scroll-mt-24 space-y-4">
          <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
            2. Bên Kiểm soát và Xử lý dữ liệu
          </Title>
          <p className="text-text-muted leading-relaxed">
            Nền tảng Nexus Platform hoạt động với tư cách là Bên Kiểm soát và Xử lý dữ liệu đối với Dữ liệu Cá nhân mà bạn cung cấp trực tiếp cho chúng tôi:
          </p>
          <div className="space-y-3 text-text-muted">
            <p><strong className="text-text-main">Chủ quản nền tảng:</strong> Hệ sinh thái Hỗ trợ Ý tưởng & Kiểm định Khởi nghiệp Sinh viên Nexus</p>
            <p><strong className="text-text-main">Nhân sự phụ trách Bảo vệ Dữ liệu (DPO):</strong> Ban Kỹ thuật & Pháp chế Nexus Platform</p>
            <p><strong className="text-text-main">Kênh liên hệ chính thức:</strong> phungluuhoanglong@gmail.com</p>
          </div>
        </section>

        {/* ── Điều 3 ── */}
        <section id="dieu-3-du-lieu-thu-thap" className="scroll-mt-24 space-y-4">
          <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
            3. Dữ liệu Cá nhân Chúng tôi Thu thập
          </Title>
          <p className="text-text-muted leading-relaxed">
            Chúng tôi thu thập các loại dữ liệu cá nhân sau đây thông qua các tương tác của bạn với Hệ thống:
          </p>

          <div className="overflow-x-auto my-4">
            <table className="w-full text-left text-xs border-collapse border border-border-app">
              <thead className="bg-surface-soft border-b border-border-app">
                <tr>
                  <th className="p-3 font-semibold text-text-main border-r border-border-app">Phân loại dữ liệu</th>
                  <th className="p-3 font-semibold text-text-main border-r border-border-app">Trường dữ liệu cụ thể</th>
                  <th className="p-3 font-semibold text-text-main">Phương thức thu thập</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-app text-text-muted">
                <tr>
                  <td className="p-3 font-semibold text-text-main border-r border-border-app">3.1. Dữ liệu định danh</td>
                  <td className="p-3 border-r border-border-app">Họ tên, Địa chỉ Email, Mật khẩu (mã hóa chuẩn quốc tế), Ảnh đại diện, Tên hiển thị công khai.</td>
                  <td className="p-3">Bạn chủ động cung cấp khi tạo và quản lý tài khoản.</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-text-main border-r border-border-app">3.2. Dữ liệu thanh toán</td>
                  <td className="p-3 border-r border-border-app">Lịch sử giao dịch ví VND, mã tham chiếu ngân hàng (Reference ID), số dư khả dụng. <em>(Lưu ý: Chúng tôi KHÔNG thu thập số thẻ tín dụng hoặc mã CVV).</em></td>
                  <td className="p-3">Ghi nhận thông qua API cổng thanh toán trung gian (SePay).</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-text-main border-r border-border-app">3.3. Dữ liệu học thuật & dự án</td>
                  <td className="p-3 border-r border-border-app">Mô tả ý tưởng, tệp đính kèm (PDF, DOCX), log tin nhắn chat trực tiếp với Supporter, báo cáo đánh giá hệ thống.</td>
                  <td className="p-3">Bạn chủ động nộp trong các Hồ sơ hỗ trợ (Case).</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-text-main border-r border-border-app">3.4. Dữ liệu kỹ thuật & Tương tác</td>
                  <td className="p-3 border-r border-border-app">Địa chỉ IP, chuỗi User-Agent trình duyệt, hệ điều hành, thời gian truy cập, cookies phiên làm việc, lịch sử nhấp chuột (Telemetry).</td>
                  <td className="p-3">Thu thập tự động bởi hệ thống máy chủ và các đoạn mã theo dõi tĩnh (Cookies) khi bạn duyệt web.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Điều 4 ── */}
        <section id="dieu-4-muc-dich-xu-ly" className="scroll-mt-24 space-y-4">
          <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
            4. Mục đích & Căn cứ Pháp lý Xử lý Dữ liệu
          </Title>
          <p className="text-text-muted leading-relaxed">
            Mọi hoạt động xử lý dữ liệu của chúng tôi đều tuân thủ nguyên tắc tính hợp pháp, dựa trên các căn cứ sau:
          </p>
          <div className="space-y-3 text-text-muted">
            <p>
              <strong className="text-text-main">Sự đồng ý rõ ràng (Consent):</strong> Thực hiện việc ghi nhận sự đồng ý bằng hành động khẳng định rõ ràng (đánh dấu vào ô check-box) khi đăng ký. Bạn có quyền rút lại sự đồng ý này bất cứ lúc nào.
            </p>
            <p>
              <strong className="text-text-main">Thực hiện Hợp đồng (Contractual Necessity):</strong> Xử lý dữ liệu định danh, thanh toán và học thuật (Điều 3.1, 3.2, 3.3) là điều kiện bắt buộc để thực hiện các cam kết Dịch vụ, phân tích hồ sơ và trả kết quả báo cáo.
            </p>
            <p>
              <strong className="text-text-main">Lợi ích Hợp pháp (Legitimate Interest):</strong> Phân tích dữ liệu kỹ thuật (Điều 3.4) để đảm bảo an toàn không gian mạng, phát hiện gian lận và tối ưu hóa hiệu suất nền tảng, miễn là không xâm phạm nghiêm trọng đến quyền và lợi ích của bạn.
            </p>
            <p>
              <strong className="text-text-main">Nghĩa vụ Pháp lý (Legal Obligation):</strong> Lưu trữ log truy cập, giao dịch tài chính để phục vụ mục đích kiểm toán và đáp ứng yêu cầu của cơ quan nhà nước có thẩm quyền theo Luật An ninh mạng và Luật Kế toán.
            </p>
          </div>
        </section>

        {/* ── Điều 5 ── */}
        <section id="dieu-5-chia-se-du-lieu" className="scroll-mt-24 space-y-4">
          <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
            5. Chia sẻ Dữ liệu & Bên thứ ba (Sub-processors)
          </Title>
          <p className="text-text-muted leading-relaxed">
            Chúng tôi không bán Dữ liệu Cá nhân của bạn. Dữ liệu chỉ được chia sẻ theo nguyên tắc "biết những gì cần biết" (need-to-know basis) với các nhà cung cấp dịch vụ hạ tầng đám mây uy tín (Sub-processors) có ký kết Thỏa thuận Bảo vệ Dữ liệu (DPA):
          </p>
          <div className="space-y-3 pl-4 border-l-2 border-border-app text-text-muted">
            <p><strong className="text-text-main">Cung cấp sức mạnh AI:</strong> Vercel AI SDK, OpenAI, Google Gemini. Chúng tôi đã thiết lập giới hạn API để vô hiệu hóa việc lưu trữ dữ liệu của bạn nhằm mục đích huấn luyện (train) các mô hình AI công khai của các đối tác này.</p>
            <p><strong className="text-text-main">Cổng thanh toán điện tử:</strong> SePay (nhận webhook giao dịch đối soát tự động thông qua OpenBanking).</p>
            <p><strong className="text-text-main">Hạ tầng Real-time & Giao tiếp:</strong> Centrifugo (máy chủ WebSocket duy trì chat), Resend (gửi email thông báo, OTP hệ thống).</p>
            <p><strong className="text-text-main">Lưu trữ tệp & Cơ sở dữ liệu:</strong> Cloudinary (Lưu trữ avatar, file đính kèm), các nhà cung cấp VPS/Database Cloud đặt máy chủ tuân thủ tiêu chuẩn an ninh mạng (Supabase/PostgreSQL).</p>
          </div>
          <p className="text-text-muted leading-relaxed mt-2">
            <em>Lưu ý về Chuyển giao dữ liệu xuyên biên giới:</em> Một số dịch vụ đám mây có thể lưu trữ dữ liệu ngoài lãnh thổ Việt Nam. Nexus cam kết thực hiện đầy đủ quy trình Đánh giá tác động chuyển dữ liệu ra nước ngoài và đảm bảo bên nhận dữ liệu có mức độ bảo vệ tương đương với quy định của Nghị định 13/2023/NĐ-CP.
          </p>
        </section>

        {/* ── Điều 6 ── */}
        <section id="dieu-6-thoi-gian-luu-tru" className="scroll-mt-24 space-y-4">
          <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
            6. Thời gian Lưu trữ Dữ liệu
          </Title>
          <p className="text-text-muted leading-relaxed">
            Chúng tôi chỉ lưu trữ Dữ liệu Cá nhân trong khoảng thời gian cần thiết để thực hiện các mục đích đã nêu:
          </p>
          <div className="space-y-3 text-text-muted">
            <p><strong className="text-text-main">Dữ liệu tài khoản & Hồ sơ dự án:</strong> Lưu trữ trong suốt thời gian tài khoản hoạt động cho đến khi bạn yêu cầu xóa hoặc đóng tài khoản.</p>
            <p><strong className="text-text-main">Dữ liệu giao dịch:</strong> Lưu trữ tối đa mười (10) năm theo quy định của pháp luật hiện hành về kế toán, thuế.</p>
            <p><strong className="text-text-main">Log kỹ thuật (IP, Sessions):</strong> Thường được tự động xóa bỏ hoặc ẩn danh hóa sau thời hạn 6 tháng đến 1 năm nhằm mục đích điều tra an ninh.</p>
          </div>
        </section>

        {/* ── Điều 7 ── */}
        <section id="dieu-7-quyen-chu-the" className="scroll-mt-24 space-y-4">
          <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
            7. Quyền của Chủ thể dữ liệu
          </Title>
          <p className="text-text-muted leading-relaxed">
            Bạn nắm giữ các quyền sau đối với dữ liệu của mình, và Nexus cung cấp sẵn các công cụ kỹ thuật để bạn thực thi:
          </p>
          <div className="space-y-3 text-text-muted">
            <p><strong className="text-text-main">Quyền truy cập & Chỉnh sửa:</strong> Tự do cập nhật họ tên, mật khẩu, và thông tin khác trực tiếp trong <em>Cài đặt Tài khoản</em>.</p>
            <p><strong className="text-text-main">Quyền rút lại sự đồng ý & Xóa dữ liệu (Quyền được lãng quên):</strong> Bạn có quyền yêu cầu chấm dứt việc xử lý dữ liệu thông qua tính năng <em>Xóa Tài Khoản (Delete Account)</em> trong phần Vùng Nguy Hiểm (Danger Zone). Hệ thống của chúng tôi được lập trình để xóa hoặc ẩn danh hóa toàn bộ thông tin định danh của bạn trong thời hạn không quá <strong>72 giờ</strong>.</p>
            <p><strong className="text-text-main">Quyền hạn chế & Phản đối xử lý:</strong> Bạn có thể liên hệ qua email DPO để yêu cầu tạm ngưng xử lý dữ liệu trong các trường hợp tranh chấp tính chính xác của dữ liệu.</p>
            <p><strong className="text-text-main">Quyền cung cấp Dữ liệu:</strong> Bạn có quyền yêu cầu xuất bản sao dữ liệu cá nhân mà chúng tôi đang lưu trữ ở định dạng máy có thể đọc được (machine-readable format).</p>
          </div>
        </section>

        {/* ── Điều 8 ── */}
        <section id="dieu-8-bao-mat" className="scroll-mt-24 space-y-4">
          <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
            8. Biện pháp Bảo mật & Xử lý sự cố
          </Title>
          <div className="space-y-3 text-text-muted">
            <p>
              <strong className="text-text-main">Biện pháp An ninh:</strong> Dữ liệu truyền tải giữa thiết bị của bạn và hệ thống được mã hóa TLS/HTTPS. Hệ cơ sở dữ liệu được phân quyền chặt chẽ theo mô hình RBAC (Role-Based Access Control) và Row-Level Security, cùng với các biện pháp chống tấn công injection, XSS, CSRF theo tiêu chuẩn OWASP.
            </p>
            <p>
              <strong className="text-text-main">Quy trình Ứng phó Sự cố (Data Breach Response):</strong> Trong trường hợp không may xảy ra vi phạm, rò rỉ dữ liệu cá nhân, chúng tôi cam kết: (1) Cách ly hệ thống và khắc phục lỗ hổng ngay lập tức; (2) Thông báo cho Cục An ninh mạng và phòng, chống tội phạm sử dụng công nghệ cao (A05) trực thuộc Bộ Công an trong thời hạn <strong>72 giờ</strong>; và (3) Gửi email thông báo khẩn cấp, minh bạch tới người dùng bị ảnh hưởng, kèm theo các biện pháp tự bảo vệ.
            </p>
          </div>
        </section>

        {/* ── Điều 9 ── */}
        <section id="dieu-9-quyen-tre-em" className="scroll-mt-24 space-y-4">
          <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
            9. Quyền riêng tư của Trẻ em
          </Title>
          <p className="text-text-muted leading-relaxed">
            Dịch vụ của Nexus Platform được thiết kế hướng tới môi trường giáo dục đại học. Chúng tôi không cố ý thu thập dữ liệu cá nhân của người dưới 16 tuổi. Trẻ em từ 7 tuổi đến dưới 16 tuổi khi tạo tài khoản phải có sự đồng ý giám sát của cha mẹ hoặc người giám hộ hợp pháp. Nếu phát hiện dữ liệu của đối tượng này được cung cấp trái quy định, chúng tôi sẽ tiến hành xóa bỏ không cần báo trước.
          </p>
        </section>

        {/* ── Điều 10 ── */}
        <section id="dieu-10-lien-he" className="scroll-mt-24 space-y-4">
          <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
            10. Cập nhật chính sách & Liên hệ
          </Title>
          <p className="text-text-muted leading-relaxed">
            Chính sách bảo mật này có hiệu lực từ ngày công bố ở đầu trang. Khi chúng tôi có những sửa đổi mang tính chất quan trọng ảnh hưởng đến quyền lợi của bạn, hệ thống sẽ yêu cầu bạn xác nhận đồng ý lại ở lần đăng nhập tiếp theo.
          </p>
          <p className="text-text-muted leading-relaxed">
            Mọi thắc mắc, yêu cầu khiếu nại hoặc thực thi quyền chủ thể dữ liệu, vui lòng gửi email tới Bộ phận Pháp chế (DPO) qua địa chỉ: <strong className="text-brand">phungluuhoanglong@gmail.com</strong>. Chúng tôi cam kết xử lý và phản hồi trong thời gian sớm nhất theo luật định.
          </p>
        </section>
      </div>
    </PolicyDocumentLayout>
  );
}
