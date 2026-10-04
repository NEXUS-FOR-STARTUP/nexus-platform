import { Title } from "@mantine/core";

export default function PrivacySections1() {
  return (
    <>
      <section id="dieu-1-pham-vi" className="scroll-mt-24 space-y-4">
        <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
          Điều 1. Phạm vi áp dụng
        </Title>
        <p className="text-text-muted leading-relaxed">
          Chính sách này áp dụng đối với hoạt động xử lý dữ liệu cá nhân phát sinh từ việc người dùng tạo tài khoản, sử dụng website và API, tạo Case, gửi tin nhắn, tải tài liệu, sử dụng chức năng AI, thực hiện giao dịch hoặc liên hệ với Nexus.
        </p>
        <p className="text-text-muted leading-relaxed">
          Nexus thực hiện hoạt động xử lý dữ liệu cá nhân phù hợp với pháp luật Việt Nam hiện hành về bảo vệ dữ liệu cá nhân và các quy định pháp luật khác có liên quan.
        </p>
      </section>

      <section id="dieu-2-ben-chiu-trach-nhiem" className="scroll-mt-24 space-y-4">
        <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
          Điều 2. Bên chịu trách nhiệm xử lý dữ liệu
        </Title>
        <p className="text-text-muted leading-relaxed">
          Đơn vị vận hành Nexus và chịu trách nhiệm đối với hoạt động xử lý dữ liệu được quy định trong Chính sách này là <strong>Nexus for Startup</strong>, sử dụng tên thương mại Nexus Platform.
        </p>
        <p className="text-text-muted leading-relaxed">
          Đầu mối tiếp nhận yêu cầu liên quan đến dữ liệu cá nhân là <strong className="text-brand">phungluuhoanglong@gmail.com</strong>.
        </p>
      </section>

      <section id="dieu-3-du-lieu-tai-khoan" className="scroll-mt-24 space-y-4">
        <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
          Điều 3. Dữ liệu tài khoản
        </Title>
        <p className="text-text-muted leading-relaxed">
          Trong quá trình tạo và sử dụng tài khoản, Nexus có thể xử lý họ tên hoặc tên hiển thị, địa chỉ email, username, ảnh đại diện, vai trò tài khoản, trạng thái xác minh email và các thông tin cần thiết cho quá trình xác thực.
        </p>
        <p className="text-text-muted leading-relaxed">
          Trường hợp người dùng đăng nhập bằng Google, Nexus có thể xử lý các thông tin xác thực cần thiết để duy trì kết nối với tài khoản Google. Trường hợp người dùng thiết lập mật khẩu, Nexus lưu trữ thông tin xác thực dưới dạng được hệ thống bảo vệ thay vì lưu mật khẩu dưới dạng văn bản thuần túy.
        </p>
        <p className="text-text-muted leading-relaxed">
          Nexus cũng xử lý một số thông tin kỹ thuật của phiên đăng nhập, bao gồm địa chỉ IP và User-Agent.
        </p>
      </section>

      <section id="dieu-4-du-lieu-case" className="scroll-mt-24 space-y-4">
        <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
          Điều 4. Dữ liệu Case và dự án
        </Title>
        <p className="text-text-muted leading-relaxed">
          Khi người dùng tạo hoặc tham gia một Case, Nexus có thể xử lý các thông tin như tên nhóm, trường, bối cảnh học tập hoặc dự án, số nhóm, deadline và các thông tin mô tả dự án.
        </p>
        <p className="text-text-muted leading-relaxed">
          Dữ liệu dự án có thể bao gồm tên dự án, vấn đề cần giải quyết, giải pháp, nhóm khách hàng mục tiêu, MVP, thông tin về kỹ năng hoặc kinh nghiệm của thành viên, nội dung intake, các bản sửa đổi, tài liệu đính kèm, kết quả đánh giá và báo cáo do hệ thống tạo ra.
        </p>
        <p className="text-text-muted leading-relaxed">
          Phạm vi cụ thể của dữ liệu phụ thuộc vào nội dung mà người dùng chủ động cung cấp.
        </p>
      </section>

      <section id="dieu-5-du-lieu-trao-doi" className="scroll-mt-24 space-y-4">
        <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
          Điều 5. Dữ liệu trao đổi
        </Title>
        <p className="text-text-muted leading-relaxed">
          Nexus lưu trữ nội dung trao đổi giữa người dùng và Supporter trong Case, bao gồm nội dung tin nhắn, thời điểm gửi, trạng thái đã đọc và các thông tin liên quan đến việc gửi thông báo.
        </p>
        <p className="text-text-muted leading-relaxed">
          Tin nhắn hiện không có cơ chế tự động xóa hoặc tự động hết hạn sau một khoảng thời gian cố định.
        </p>
      </section>

      <section id="dieu-6-du-lieu-thanh-toan" className="scroll-mt-24 space-y-4">
        <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
          Điều 6. Dữ liệu thanh toán
        </Title>
        <p className="text-text-muted leading-relaxed">
          Khi người dùng thực hiện giao dịch trên Nexus, hệ thống có thể xử lý số tiền nạp, nội dung chuyển khoản, mã giao dịch ngân hàng do hệ thống đối soát cung cấp, thời điểm ghi nhận giao dịch, chứng từ thanh toán do người dùng tải lên, Số dư Nexus, đơn hàng và lịch sử Credit.
        </p>
        <p className="text-text-muted leading-relaxed">
          Flow thanh toán hiện tại không thu thập thông tin thẻ tín dụng hoặc mã CVV.
        </p>
        <p className="text-text-muted leading-relaxed">
          Nexus hiện không cung cấp chức năng rút Số dư Nexus về tài khoản ngân hàng và không thu thập CCCD hoặc hộ chiếu cho mục đích rút tiền.
        </p>
      </section>

      <section id="dieu-7-du-lieu-ky-thuat" className="scroll-mt-24 space-y-4">
        <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
          Điều 7. Dữ liệu kỹ thuật và nhật ký hệ thống
        </Title>
        <p className="text-text-muted leading-relaxed">
          Để duy trì hoạt động, bảo mật và xử lý lỗi, Nexus có thể xử lý địa chỉ IP, User-Agent, thông tin phiên đăng nhập, mã truy vết yêu cầu, request log, error log và audit log.
        </p>
        <p className="text-text-muted leading-relaxed">
          Tại thời điểm Chính sách này được ban hành, ứng dụng Nexus không tích hợp các nền tảng phân tích hành vi như Google Analytics, PostHog, Mixpanel hoặc Hotjar và không sử dụng dữ liệu người dùng cho quảng cáo hành vi.
        </p>
        <p className="text-text-muted leading-relaxed">
          Trường hợp Nexus bổ sung các công nghệ tracking mới làm thay đổi đáng kể hoạt động xử lý dữ liệu, Nexus sẽ cập nhật Chính sách này và áp dụng cơ chế thông báo hoặc xin sự đồng ý phù hợp khi pháp luật yêu cầu.
        </p>
      </section>

      <section id="dieu-8-muc-dich" className="scroll-mt-24 space-y-4">
        <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
          Điều 8. Mục đích xử lý dữ liệu
        </Title>
        <p className="text-text-muted leading-relaxed">
          Nexus xử lý dữ liệu cá nhân nhằm tạo và quản lý tài khoản, xác thực người dùng, quản lý phiên đăng nhập, bảo vệ tài khoản, tạo và vận hành Case, lưu trữ tài liệu, phân công Supporter, cung cấp chức năng AI, tạo báo cáo, cung cấp chat, gửi thông báo, xử lý giao dịch, quản lý Số dư Nexus và Credit, phát hiện lỗi, ngăn chặn hành vi lạm dụng, hỗ trợ người dùng, giải quyết tranh chấp và thực hiện nghĩa vụ pháp luật.
        </p>
        <p className="text-text-muted leading-relaxed">
          Nexus không bán dữ liệu cá nhân của người dùng.
        </p>
      </section>

      <section id="dieu-9-xu-ly-ai" className="scroll-mt-24 space-y-4">
        <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
          Điều 9. Xử lý dữ liệu bằng trí tuệ nhân tạo
        </Title>
        <p className="text-text-muted leading-relaxed">
          Một số chức năng của Nexus gửi dữ liệu dự án tới hệ thống AI để phân tích.
        </p>
        <p className="text-text-muted leading-relaxed">
          Đối với chức năng đánh giá mức độ phù hợp giữa nhóm và ý tưởng, Nexus có thể gửi thông tin mô tả ý tưởng, vấn đề, giải pháp, khách hàng, MVP, kỹ năng và kinh nghiệm của nhóm tới Google Gemini để tạo kết quả đánh giá. Tên và email người dùng không được chủ đích đưa vào prompt của flow này.
        </p>
        <p className="text-text-muted leading-relaxed">
          Đối với quy trình audit chuyên sâu, Nexus tập hợp nội dung intake, báo cáo Team–Idea Fit nếu có và các tài liệu người dùng tải lên trong môi trường xử lý dành cho tác vụ AI. Hệ thống agent sau đó được yêu cầu đọc các dữ liệu này để thực hiện phân tích.
        </p>
        <p className="text-text-muted leading-relaxed">
          Nhà cung cấp mô hình cụ thể của quy trình audit chuyên sâu phụ thuộc vào cấu hình production tại thời điểm xử lý. Nexus chỉ công bố tên nhà cung cấp cụ thể khi cấu hình production đã được xác nhận.
        </p>
        <p className="text-text-muted leading-relaxed">
          Nexus không tuyên bố rằng mọi nhà cung cấp AI đều không lưu giữ hoặc không sử dụng dữ liệu để cải thiện mô hình nếu chưa có căn cứ kỹ thuật, điều khoản dịch vụ hoặc thỏa thuận phù hợp để xác nhận điều đó.
        </p>
      </section>

      <section id="dieu-10-nha-cung-cap" className="scroll-mt-24 space-y-4">
        <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
          Điều 10. Nhà cung cấp dịch vụ
        </Title>
        <p className="text-text-muted leading-relaxed">
          Trong phạm vi cần thiết để vận hành Nexus, dữ liệu có thể được xử lý bởi một số nhà cung cấp dịch vụ bên ngoài.
        </p>
        <p className="text-text-muted leading-relaxed">
          Google được sử dụng cho đăng nhập Google và một số chức năng AI thông qua Gemini. Cloudinary được sử dụng để lưu trữ một số tài liệu, ảnh đại diện và chứng từ thanh toán. Resend được sử dụng để gửi OTP và email giao dịch. SePay được sử dụng để hỗ trợ đối soát giao dịch chuyển khoản. Telegram có thể được sử dụng để gửi một số thông báo vận hành cho Admin hoặc Supporter.
        </p>
        <p className="text-text-muted leading-relaxed">
          Đối với quy trình audit chuyên sâu, một nhà cung cấp mô hình AI khác có thể được sử dụng tùy theo cấu hình production tại thời điểm chạy.
        </p>
        <p className="text-text-muted leading-relaxed">
          Nexus chỉ chia sẻ dữ liệu trong phạm vi cần thiết cho mục đích cung cấp dịch vụ tương ứng.
        </p>
      </section>

      <section id="dieu-11-xuyen-bien-gioi" className="scroll-mt-24 space-y-4">
        <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
          Điều 11. Xử lý dữ liệu ngoài lãnh thổ Việt Nam
        </Title>
        <p className="text-text-muted leading-relaxed">
          Một số nhà cung cấp công nghệ mà Nexus sử dụng có thể vận hành hạ tầng tại quốc gia khác Việt Nam. Vì vậy, trong một số trường hợp dữ liệu có thể được truyền hoặc xử lý ngoài lãnh thổ Việt Nam.
        </p>
        <p className="text-text-muted leading-relaxed">
          Khi hoạt động chuyển hoặc xử lý dữ liệu thuộc trường hợp pháp luật yêu cầu thực hiện thủ tục hoặc biện pháp bảo vệ cụ thể, Nexus có trách nhiệm thực hiện nghĩa vụ tương ứng theo quy định.
        </p>
      </section>
    </>
  );
}
