import { Title } from "@mantine/core";

export default function PrivacySections2() {
  return (
    <>
      <section id="dieu-12-quyen-truy-cap" className="scroll-mt-24 space-y-4">
        <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
          Điều 12. Quyền truy cập dữ liệu
        </Title>
        <p className="text-text-muted leading-relaxed">
          Người dùng chỉ được truy cập các Case thuộc quyền của mình hoặc Case mà mình được phép tham gia.
        </p>
        <p className="text-text-muted leading-relaxed">
          Supporter chỉ được truy cập các Case được phân công cho mình.
        </p>
        <p className="text-text-muted leading-relaxed">
          Admin có quyền truy cập rộng hơn khi cần để quản trị tài khoản, xử lý Case, phân công Supporter, kiểm tra giao dịch, hỗ trợ người dùng, giải quyết tranh chấp, điều tra sự cố hoặc bảo vệ hệ thống.
        </p>
        <p className="text-text-muted leading-relaxed">
          Trong phạm vi nhiệm vụ được giao, Admin có thể truy cập hồ sơ tài khoản, nội dung Case, tài liệu, tin nhắn và dữ liệu giao dịch.
        </p>
      </section>

      <section id="dieu-13-luu-tru-tep" className="scroll-mt-24 space-y-4">
        <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
          Điều 13. Lưu trữ tệp
        </Title>
        <p className="text-text-muted leading-relaxed">
          Nexus sử dụng Cloudinary để lưu trữ một số loại tệp do người dùng tải lên.
        </p>
        <p className="text-text-muted leading-relaxed">
          Hệ thống áp dụng giới hạn định dạng và dung lượng tùy theo loại tài liệu. Việc một bản ghi liên quan đến Case hoặc tài khoản bị xóa khỏi cơ sở dữ liệu không mặc nhiên đồng nghĩa bản sao tương ứng trên hệ thống lưu trữ bên ngoài bị xóa ngay tại cùng thời điểm.
        </p>
        <p className="text-text-muted leading-relaxed">
          Người dùng có quyền liên hệ Nexus để yêu cầu xem xét việc xóa dữ liệu hoặc tệp cụ thể theo quy định tại Chính sách này và pháp luật áp dụng.
        </p>
      </section>

      <section id="dieu-14-thoi-gian-luu-tru" className="scroll-mt-24 space-y-4">
        <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
          Điều 14. Thời gian lưu trữ dữ liệu
        </Title>
        <p className="text-text-muted leading-relaxed">
          Nexus lưu dữ liệu trong khoảng thời gian cần thiết để thực hiện mục đích xử lý và các mục đích hợp pháp liên quan.
        </p>
        <p className="text-text-muted leading-relaxed">
          Hệ thống hiện tại không áp dụng một thời hạn chung cho tất cả các loại dữ liệu. Tài khoản không tự động hết hạn; Case và tin nhắn không tự động bị xóa theo một thời hạn chung; Số dư Nexus và Credit không có cơ chế tự động hết hạn; dữ liệu giao dịch được duy trì để phục vụ đối soát và quản lý hồ sơ; log kỹ thuật được lưu phục vụ hoạt động vận hành và xử lý sự cố.
        </p>
        <p className="text-text-muted leading-relaxed">
          Các nội dung trên mô tả cơ chế hiện tại và không được hiểu là cam kết lưu giữ dữ liệu vô thời hạn.
        </p>
      </section>

      <section id="dieu-15-xoa-tai-khoan" className="scroll-mt-24 space-y-4">
        <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
          Điều 15. Xóa tài khoản
        </Title>
        <p className="text-text-muted leading-relaxed">
          Khi người dùng thực hiện chức năng xóa tài khoản, Nexus vô hiệu hóa tài khoản, ẩn danh hóa các thông tin định danh chính, xóa các phiên đăng nhập và xóa các liên kết tài khoản xác thực liên quan.
        </p>
        <p className="text-text-muted leading-relaxed">
          Case, tin nhắn, báo cáo, giao dịch, Credit và một số tài liệu liên quan không nhất thiết bị xóa đồng thời với tài khoản.
        </p>
        <p className="text-text-muted leading-relaxed">
          Nexus có thể tiếp tục lưu giữ dữ liệu khi việc lưu giữ cần thiết để duy trì tính toàn vẹn của hồ sơ giao dịch, bảo vệ quyền của các bên, giải quyết tranh chấp, duy trì dữ liệu liên quan tới thành viên khác trong Case hoặc thực hiện nghĩa vụ pháp luật.
        </p>
      </section>

      <section id="dieu-16-quyen-chu-the" className="scroll-mt-24 space-y-4">
        <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
          Điều 16. Quyền của chủ thể dữ liệu
        </Title>
        <p className="text-text-muted leading-relaxed">
          Trong phạm vi pháp luật áp dụng, người dùng có quyền yêu cầu được biết về hoạt động xử lý dữ liệu, yêu cầu truy cập hoặc chỉnh sửa dữ liệu cá nhân, rút lại sự đồng ý đối với hoạt động xử lý dựa trên sự đồng ý, yêu cầu hạn chế hoặc phản đối xử lý trong trường hợp pháp luật cho phép, yêu cầu xóa dữ liệu, yêu cầu cung cấp bản sao dữ liệu và thực hiện quyền khiếu nại.
        </p>
        <p className="text-text-muted leading-relaxed">
          Việc thực hiện quyền không phải lúc nào cũng dẫn tới việc dữ liệu được xóa hoặc ngừng xử lý ngay lập tức. Nexus có thể tiếp tục lưu giữ hoặc xử lý dữ liệu nếu có căn cứ pháp luật phù hợp.
        </p>
        <p className="text-text-muted leading-relaxed">
          Yêu cầu về dữ liệu cá nhân được gửi tới <strong className="text-brand">phungluuhoanglong@gmail.com</strong>. Nexus có thể yêu cầu thông tin cần thiết để xác minh người gửi yêu cầu là chủ thể dữ liệu hoặc người đại diện hợp pháp.
        </p>
      </section>

      <section id="dieu-17-cookie" className="scroll-mt-24 space-y-4">
        <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
          Điều 17. Cookie và cơ chế duy trì phiên
        </Title>
        <p className="text-text-muted leading-relaxed">
          Nexus sử dụng cookie hoặc cơ chế tương đương khi cần thiết để duy trì phiên đăng nhập, bảo mật tài khoản và cung cấp chức năng kỹ thuật của Nền tảng.
        </p>
        <p className="text-text-muted leading-relaxed">
          Tại thời điểm Chính sách này được ban hành, Nexus không sử dụng cookie cho mục đích quảng cáo hành vi.
        </p>
      </section>

      <section id="dieu-18-bao-mat" className="scroll-mt-24 space-y-4">
        <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
          Điều 18. Biện pháp bảo mật
        </Title>
        <p className="text-text-muted leading-relaxed">
          Nexus áp dụng các biện pháp kỹ thuật phù hợp với kiến trúc hiện tại, bao gồm HTTPS/TLS, kiểm soát quyền truy cập theo vai trò, xác minh quyền truy cập Case, xác minh email, giới hạn tần suất một số loại request, cơ chế khóa đăng nhập tạm thời, kiểm tra dữ liệu đầu vào, security headers và logging phục vụ vận hành.
        </p>
        <p className="text-text-muted leading-relaxed">
          Các biện pháp này nhằm giảm thiểu rủi ro nhưng không tạo ra bảo đảm rằng hệ thống không bao giờ xảy ra sự cố.
        </p>
        <p className="text-text-muted leading-relaxed">
          Khi phát sinh sự cố dữ liệu cá nhân, Nexus sẽ thực hiện các biện pháp xử lý và nghĩa vụ thông báo theo quy định pháp luật áp dụng.
        </p>
      </section>

      <section id="dieu-19-nguoi-dung-chua-thanh-nien" className="scroll-mt-24 space-y-4">
        <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
          Điều 19. Người dùng chưa thành niên
        </Title>
        <p className="text-text-muted leading-relaxed">
          Nexus được thiết kế chủ yếu cho môi trường giáo dục đại học và hiện không thực hiện xác minh tuổi bắt buộc đối với mọi tài khoản.
        </p>
        <p className="text-text-muted leading-relaxed">
          Trường hợp người chưa thành niên sử dụng Nexus và pháp luật yêu cầu có sự đồng ý hoặc giám sát của cha, mẹ hoặc người giám hộ, người dùng và người đại diện có trách nhiệm tuân thủ yêu cầu đó.
        </p>
        <p className="text-text-muted leading-relaxed">
          Nếu Nexus phát hiện dữ liệu của trẻ em đang được xử lý không phù hợp với pháp luật, Nexus sẽ áp dụng biện pháp cần thiết để hạn chế hoặc chấm dứt hoạt động xử lý.
        </p>
      </section>

      <section id="dieu-20-sua-doi" className="scroll-mt-24 space-y-4">
        <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
          Điều 20. Sửa đổi Chính sách
        </Title>
        <p className="text-text-muted leading-relaxed">
          Nexus có thể cập nhật Chính sách này khi hoạt động xử lý dữ liệu, công nghệ sử dụng hoặc yêu cầu pháp luật thay đổi.
        </p>
        <p className="text-text-muted leading-relaxed">
          Trường hợp thay đổi làm phát sinh mục đích xử lý mới hoặc ảnh hưởng đáng kể tới quyền của người dùng, Nexus sẽ thực hiện việc thông báo và xin sự đồng ý trong trường hợp pháp luật yêu cầu.
        </p>
      </section>

      <section id="dieu-21-lien-he" className="scroll-mt-24 space-y-4">
        <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
          Điều 21. Liên hệ
        </Title>
        <p className="text-text-muted leading-relaxed">
          Mọi câu hỏi, khiếu nại hoặc yêu cầu thực hiện quyền đối với dữ liệu cá nhân được gửi tới:
        </p>
        <p className="text-text-muted font-medium">
          <strong className="text-brand">phungluuhoanglong@gmail.com</strong>
        </p>
      </section>
    </>
  );
}
