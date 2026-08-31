import type { Metadata } from "next";
import { Title } from "@mantine/core";
import PolicyDocumentLayout, {
  type TOCItem,
} from "@/components/policy/PolicyDocumentLayout";

export const metadata: Metadata = {
  title: "Chính sách Thanh toán & Hoàn tiền | Nexus Platform",
  description:
    "Quy định chi tiết về quản lý ví VND, vòng đời Credit, chính sách hoàn tiền, rút tiền và giải quyết khiếu nại giao dịch theo tiêu chuẩn quốc tế.",
};

const refundTOC: TOCItem[] = [
  { id: "dieu-1-tong-quan", title: "1. Tổng quan & Nguyên tắc chung" },
  { id: "dieu-2-vi-vnd", title: "2. Quy chế Ví tài khoản (VND Wallet)" },
  { id: "dieu-3-vong-doi-credit", title: "3. Vòng đời Điểm tín dụng (Credit)" },
  { id: "dieu-4-chinh-sach-hoan-tien", title: "4. Chính sách Hoàn tiền (Refunds)" },
  { id: "dieu-5-rut-tien-aml", title: "5. Rút tiền & Phòng chống rửa tiền (AML)" },
  { id: "dieu-6-khieu-nai-chargeback", title: "6. Khiếu nại giao dịch (Chargebacks)" },
  { id: "dieu-7-thue-le-phi", title: "7. Thuế & Lệ phí" },
];

export default function RefundPolicyPage() {
  return (
    <PolicyDocumentLayout
      title="Chính sách Thanh toán & Hoàn tiền"
      subtitle="Văn bản này quy định minh bạch về cơ chế tài chính, vòng đời tín dụng và bảo vệ quyền lợi người dùng trên Nexus Platform, tuân thủ các quy chuẩn thanh toán điện tử quốc tế."
      effectiveDate="30/08/2026"
      version="2026-08-v2.0"
      tocItems={refundTOC}
    >
      <div className="space-y-10">
        {/* ── Điều 1 ── */}
        <section id="dieu-1-tong-quan" className="scroll-mt-24 space-y-4">
          <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
            1. Tổng quan & Nguyên tắc chung
          </Title>
          <p className="text-text-muted leading-relaxed">
            Chính sách Thanh toán & Hoàn tiền này (sau đây gọi là "Chính sách") thiết lập các khung pháp lý và quy trình vận hành liên quan đến tiền tệ và tài sản kỹ thuật số (Credit) trên nền tảng Nexus Platform. Bằng việc thực hiện bất kỳ giao dịch nạp tiền hoặc mua gói dịch vụ nào, bạn đồng ý chịu sự ràng buộc bởi các quy định tài chính dưới đây.
          </p>
        </section>

        {/* ── Điều 2 ── */}
        <section id="dieu-2-vi-vnd" className="scroll-mt-24 space-y-4">
          <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
            2. Quy chế Ví tài khoản (VND Wallet)
          </Title>
          <div className="space-y-3 text-text-muted">
            <p>
              <strong className="text-text-main">2.1. Đơn vị tiền tệ:</strong> Mọi giao dịch được ghi nhận và xử lý bằng Việt Nam Đồng (VND). Số dư trong Ví cá nhân (`UserWallet`) thể hiện số tiền thực tế bạn đã nạp qua cổng thanh toán được cấp phép (SePay/VietQR).
            </p>
            <p>
              <strong className="text-text-main">2.2. Không hết hạn:</strong> Số dư tiền thật trong Ví VND của bạn KHÔNG bao giờ hết hạn. Nexus không thu phí quản lý, phí duy trì tài khoản, hay phí phạt do tài khoản không hoạt động (inactivity fee).
            </p>
            <p>
              <strong className="text-text-main">2.3. Mục đích sử dụng:</strong> Số dư Ví VND chỉ được sử dụng để mua sắm các gói dịch vụ, điểm Credit hoặc các tiện ích nội bộ trên hệ thống Nexus Platform.
            </p>
          </div>
        </section>

        {/* ── Điều 3 ── */}
        <section id="dieu-3-vong-doi-credit" className="scroll-mt-24 space-y-4">
          <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
            3. Vòng đời Điểm tín dụng (Credit Lifecycle)
          </Title>
          <p className="text-text-muted leading-relaxed">
            Credit là đơn vị quy đổi dịch vụ. Nexus áp dụng chính sách quản lý vòng đời Credit nghiêm ngặt nhằm đảm bảo chất lượng cam kết:
          </p>
          <div className="space-y-3 text-text-muted">
            <p>
              <strong className="text-text-main">3.1. Phân loại & Hạn sử dụng:</strong> 
              <br/>- <em>Credit Trả phí (Paid Credit):</em> Mua bằng tiền từ Ví VND, có thời hạn hiệu lực chính xác là <strong>mười hai (12) tháng (365 ngày)</strong> kể từ thời điểm giao dịch thành công.
              <br/>- <em>Credit Khuyến mãi/Thưởng (Promotional Credit):</em> Được cấp qua các chương trình đối tác, mặc định hết hạn sau <strong>chín mươi (90) ngày</strong> và không có giá trị quy đổi thành tiền mặt.
            </p>
            <p>
              <strong className="text-text-main">3.2. Thông báo hết hạn:</strong> Tuân thủ luật bảo vệ người tiêu dùng, hệ thống sẽ tự động gửi email và thông báo (push notification) nhắc nhở trước khi Credit hết hạn tại các mốc: 30 ngày, 7 ngày và 24 giờ.
            </p>
            <p>
              <strong className="text-text-main">3.3. Thời điểm Khấu trừ:</strong> Credit CHỈ bị trừ vĩnh viễn khỏi tài khoản của bạn khi Cố vấn chuyên môn (Supporter) đã chính thức xuất bản Báo cáo đánh giá (trạng thái `Report Ready`). Mọi thao tác nộp hồ sơ, trao đổi hoặc vòng sửa đổi (Revision) đều không làm phát sinh thêm phí.
            </p>
            <p>
              <strong className="text-text-main">3.4. Chuyển nhượng (Transferability):</strong> Để phòng chống rửa tiền và chợ đen, Credit không thể chuyển nhượng giữa hai tài khoản độc lập. Tuy nhiên, toàn bộ thành viên trong cùng một Hồ sơ (Case) đều được thụ hưởng chung quyền lợi do Chủ sở hữu (Owner) chi trả.
            </p>
          </div>
        </section>

        {/* ── Điều 4 ── */}
        <section id="dieu-4-chinh-sach-hoan-tien" className="scroll-mt-24 space-y-4">
          <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
            4. Chính sách Hoàn tiền (Refund Policy)
          </Title>
          <p className="text-text-muted leading-relaxed">
            Nexus cam kết bảo vệ khoản đầu tư giáo dục của bạn với chính sách hoàn trả minh bạch:
          </p>
          <div className="space-y-3 text-text-muted">
            <p>
              <strong className="text-text-main">4.1. Hoàn 100% tự động về Ví VND:</strong> Áp dụng ngay lập tức trong các trường hợp:
              <br/>- Hệ thống/Admin từ chối tiếp nhận hồ sơ (Veto) do vượt quá năng lực chuyên môn hoặc nội dung không hợp lệ.
              <br/>- Cố vấn (Supporter) vi phạm Cam kết thời gian dịch vụ (SLA Breach), trễ hẹn trả báo cáo quá 48 giờ.
              <br/>- Bạn chủ động ấn nút "Hủy hồ sơ" trước khi Supporter bắt đầu quy trình phân tích (`pending` hoặc `assigned`).
            </p>
            <p>
              <strong className="text-text-main">4.2. Hoàn tiền một phần (Pro-rated Refund):</strong> Nếu hồ sơ đang trong quá trình phân tích (`in_progress`) nhưng bạn gặp sự cố bất khả kháng cần dừng lại, Quản trị viên sẽ xem xét khối lượng công việc đã thực hiện để quyết định hoàn trả tối đa 50% giá trị gói.
            </p>
            <p>
              <strong className="text-text-main">4.3. Không đủ điều kiện hoàn tiền:</strong> Tuyệt đối không hoàn tiền khi Báo cáo đã được xuất bản (`completed`), hoặc khi tài khoản của bạn bị khóa do vi phạm liêm chính học thuật (đạo văn), gian lận hệ thống.
            </p>
          </div>
        </section>

        {/* ── Điều 5 ── */}
        <section id="dieu-5-rut-tien-aml" className="scroll-mt-24 space-y-4">
          <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
            5. Rút tiền & Phòng chống rửa tiền (AML Compliance)
          </Title>
          <div className="space-y-3 text-text-muted">
            <p>
              <strong className="text-text-main">5.1. Định danh chính chủ:</strong> Để tuân thủ Luật Phòng, chống rửa tiền, mọi yêu cầu rút số dư khả dụng từ Ví VND về tài khoản ngân hàng bắt buộc phải khớp lệnh với thông tin định danh (Tên chủ tài khoản ngân hàng phải khớp với tên đã đăng ký tài khoản). Chúng tôi có quyền yêu cầu xác minh danh tính (KYC) đối với các khoản rút bất thường.
            </p>
            <p>
              <strong className="text-text-main">5.2. Mức rút & Thời gian:</strong> Số tiền yêu cầu tối thiểu là 50.000 VNĐ. Thời gian xử lý đối soát và giải ngân chuẩn là từ ba (03) đến năm (05) ngày làm việc (không tính T7, CN và ngày Lễ).
            </p>
          </div>
        </section>

        {/* ── Điều 6 ── */}
        <section id="dieu-6-khieu-nai-chargeback" className="scroll-mt-24 space-y-4">
          <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
            6. Khiếu nại giao dịch (Chargebacks & Disputes)
          </Title>
          <div className="space-y-3 text-text-muted">
            <p>
              <strong className="text-text-main">6.1. Giải quyết nội bộ trước:</strong> Trước khi yêu cầu ngân hàng hoàn tiền (chargeback), bạn đồng ý liên hệ với bộ phận CSKH của Nexus (phungluuhoanglong@gmail.com) để chúng tôi có cơ hội tra soát và giải quyết thỏa đáng.
            </p>
            <p>
              <strong className="text-text-main">6.2. Gian lận Chargeback:</strong> Việc cố tình lạm dụng cơ chế chargeback của ngân hàng sau khi đã nhận và sử dụng dịch vụ thành công cấu thành hành vi lừa đảo. Nexus bảo lưu quyền khóa vĩnh viễn tài khoản và cung cấp bằng chứng giao dịch cho cơ quan pháp luật hoặc tổ chức phát hành thẻ.
            </p>
          </div>
        </section>

        {/* ── Điều 7 ── */}
        <section id="dieu-7-thue-le-phi" className="scroll-mt-24 space-y-4">
          <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
            7. Thuế & Lệ phí
          </Title>
          <p className="text-text-muted leading-relaxed">
            Trừ khi được biểu thị rõ ràng, mọi mức giá niêm yết trên Nexus Platform đã bao gồm các loại thuế gián thu (như Thuế Giá trị Gia tăng - VAT) theo quy định của pháp luật Việt Nam. Người dùng tự chịu trách nhiệm kê khai và nộp các loại thuế thu nhập cá nhân phát sinh từ việc sử dụng các dịch vụ liên đới (nếu có). Phí chuyển khoản khi rút tiền (do ngân hàng thụ hưởng thu) sẽ do người dùng chi trả.
          </p>
        </section>
      </div>
    </PolicyDocumentLayout>
  );
}
