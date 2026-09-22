import { Title } from "@mantine/core";

export default function RefundSections1() {
  return (
    <>
      <section id="dieu-1-so-du-nexus" className="scroll-mt-24 space-y-4">
        <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
          Điều 1. Số dư Nexus
        </Title>
        <p className="text-text-muted leading-relaxed">
          &quot;Số dư Nexus&quot; là số dư nội bộ được hệ thống ghi nhận cho tài khoản người dùng để sử dụng cho việc thanh toán dịch vụ trên Nexus.
        </p>
        <p className="text-text-muted leading-relaxed">
          Số dư Nexus không phải là phương tiện thanh toán có thể sử dụng bên ngoài Nền tảng, không thể chuyển trực tiếp cho tài khoản Nexus khác và tại thời điểm Chính sách này được ban hành không thể rút về tài khoản ngân hàng.
        </p>
        <p className="text-text-muted leading-relaxed">
          Hệ thống hiện không áp dụng cơ chế tự động làm hết hạn Số dư Nexus. Người dùng nên chỉ nạp số tiền dự kiến sử dụng cho các dịch vụ của Nexus.
        </p>
      </section>

      <section id="dieu-2-nap-tien" className="scroll-mt-24 space-y-4">
        <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
          Điều 2. Nạp tiền
        </Title>
        <p className="text-text-muted leading-relaxed">
          Nexus hiện hỗ trợ nạp tiền thông qua chuyển khoản ngân hàng.
        </p>
        <p className="text-text-muted leading-relaxed">
          Khi người dùng khởi tạo yêu cầu nạp tiền, hệ thống cung cấp thông tin tài khoản nhận, số tiền, nội dung chuyển khoản và mã QR khi phù hợp. Người dùng có trách nhiệm kiểm tra chính xác thông tin trước khi thực hiện giao dịch.
        </p>
        <p className="text-text-muted leading-relaxed">
          Nexus sử dụng SePay để nhận thông tin giao dịch ngân hàng và hỗ trợ việc đối soát tự động. Khi giao dịch được xác định phù hợp với yêu cầu nạp tiền, số dư được ghi nhận vào tài khoản Nexus của người dùng.
        </p>
      </section>

      <section id="dieu-3-giao-dich-khong-ghi-nhan" className="scroll-mt-24 space-y-4">
        <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
          Điều 3. Giao dịch không được tự động ghi nhận
        </Title>
        <p className="text-text-muted leading-relaxed">
          Trường hợp người dùng nhập sai nội dung chuyển khoản, chuyển sai số tiền hoặc giao dịch không thể được hệ thống đối soát vì lý do kỹ thuật, người dùng có thể liên hệ Nexus và cung cấp chứng từ cần thiết để được kiểm tra.
        </p>
        <p className="text-text-muted leading-relaxed">
          Việc Nexus yêu cầu bổ sung chứng từ trong trường hợp này nhằm mục đích xác minh giao dịch và không mặc nhiên được xem là yêu cầu KYC.
        </p>
      </section>

      <section id="dieu-4-credit" className="scroll-mt-24 space-y-4">
        <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
          Điều 4. Credit
        </Title>
        <p className="text-text-muted leading-relaxed">
          Credit là đơn vị nội bộ được sử dụng để ghi nhận quyền thực hiện một số hoạt động đánh giá trong Case.
        </p>
        <p className="text-text-muted leading-relaxed">
          Credit được gắn với Case và không được xem là tiền, không được sử dụng để thanh toán bên ngoài Nexus và không thể rút về tài khoản ngân hàng.
        </p>
        <p className="text-text-muted leading-relaxed">
          Hệ thống hiện tại không phân biệt Paid Credit và Promotional Credit thành các loại có thời hạn sử dụng khác nhau và cũng không áp dụng cơ chế tự động hết hạn Credit.
        </p>
      </section>

      <section id="dieu-5-mua-credit" className="scroll-mt-24 space-y-4">
        <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
          Điều 5. Mua Credit
        </Title>
        <p className="text-text-muted leading-relaxed">
          Người dùng có thể sử dụng Số dư Nexus để mua Credit cho một Case cụ thể.
        </p>
        <p className="text-text-muted leading-relaxed">
          Trước khi giao dịch hoàn tất, hệ thống hiển thị giá và số lượng Credit tương ứng. Khi giao dịch thành công, Số dư Nexus bị trừ và Credit được ghi nhận vào Case.
        </p>
      </section>

      <section id="dieu-6-tieu-thu-credit" className="scroll-mt-24 space-y-4">
        <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
          Điều 6. Thời điểm tiêu thụ Credit
        </Title>
        <p className="text-text-muted leading-relaxed">
          Credit được tiêu thụ khi hệ thống khởi tạo một tác vụ AI audit có tính phí cho Case.
        </p>
        <p className="text-text-muted leading-relaxed">
          Thời điểm Report Ready hoặc Completed không phải là thời điểm duy nhất quyết định việc tiêu thụ Credit.
        </p>
        <p className="text-text-muted leading-relaxed">
          Việc người dùng gửi biểu mẫu, tải tài liệu hoặc gửi tin nhắn không tự thân làm phát sinh việc tiêu thụ Credit, trừ khi hành động đó kích hoạt một tác vụ có tính phí theo cơ chế hiển thị tại thời điểm sử dụng.
        </p>
      </section>

      <section id="dieu-7-hoan-credit-loi" className="scroll-mt-24 space-y-4">
        <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
          Điều 7. Hoàn Credit do lỗi tác vụ AI
        </Title>
        <p className="text-text-muted leading-relaxed">
          Trường hợp một tác vụ AI audit bị lỗi và không tạo được báo cáo theo cơ chế của hệ thống, Nexus có thể tự động hoàn Credit đã sử dụng cho tác vụ đó về Case.
        </p>
        <p className="text-text-muted leading-relaxed">
          Việc hoàn Credit theo Điều này là việc khôi phục đơn vị sử dụng dịch vụ và không nhất thiết đồng nghĩa với việc chuyển tiền về tài khoản ngân hàng.
        </p>
      </section>

      <section id="dieu-8-huy-case" className="scroll-mt-24 space-y-4">
        <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
          Điều 8. Người dùng hủy Case
        </Title>
        <p className="text-text-muted leading-relaxed">
          Người sở hữu Case được quyền hủy Case trong các trạng thái mà hệ thống cho phép.
        </p>
        <p className="text-text-muted leading-relaxed">
          Khi Case bị hủy, Nexus xác định phần Credit chưa được sử dụng và tính giá trị hoàn dựa trên lịch sử mua và tiêu thụ Credit của Case. Giá trị tương ứng được ghi nhận trở lại vào Số dư Nexus theo cơ chế của hệ thống.
        </p>
        <p className="text-text-muted leading-relaxed">
          Credit đã được tiêu thụ cho các tác vụ đã thực hiện thông thường không được hoàn chỉ vì người dùng quyết định chấm dứt Case sau đó.
        </p>
        <p className="text-text-muted leading-relaxed">
          Nexus không áp dụng một mức hoàn cố định tối đa 50% cho mọi Case.
        </p>
      </section>
    </>
  );
}
