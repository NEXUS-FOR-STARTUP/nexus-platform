import { Title } from "@mantine/core";

export default function RefundSections2() {
  return (
    <>
      <section id="dieu-9-tu-choi-veto" className="scroll-mt-24 space-y-4">
        <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
          Điều 9. Trường hợp Nexus từ chối hoặc Veto Case
        </Title>
        <p className="text-text-muted leading-relaxed">
          Nexus có thể từ chối hoặc chấm dứt xử lý Case trong những trường hợp mà hệ thống và Điều khoản Sử dụng cho phép.
        </p>
        <p className="text-text-muted leading-relaxed">
          Trong trường hợp Admin thực hiện Veto theo flow hiện tại, hệ thống thực hiện cơ chế hoàn đầy đủ giá trị được xác định cho Case và giá trị Credit chưa sử dụng về Số dư Nexus.
        </p>
        <p className="text-text-muted leading-relaxed">
          Đối với các hình thức từ chối khác, hệ thống có thể chỉ hoàn giá trị Credit chưa được sử dụng.
        </p>
        <p className="text-text-muted leading-relaxed">
          Kết quả xử lý giao dịch được ghi nhận trong hệ thống và có thể được thông báo cho người dùng qua các kênh mà Nexus hỗ trợ.
        </p>
      </section>

      <section id="dieu-10-case-hoan-tat" className="scroll-mt-24 space-y-4">
        <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
          Điều 10. Case đã hoàn tất
        </Title>
        <p className="text-text-muted leading-relaxed">
          Sau khi Case chuyển sang trạng thái hoàn tất, chức năng hủy Case thông thường không còn khả dụng.
        </p>
        <p className="text-text-muted leading-relaxed">
          Quy định này không loại trừ quyền của người dùng yêu cầu kiểm tra giao dịch nếu có lỗi hệ thống, sai lệch trong việc ghi nhận thanh toán, dịch vụ không được cung cấp như đã thỏa thuận hoặc có căn cứ khiếu nại khác theo pháp luật.
        </p>
      </section>

      <section id="dieu-11-phuong-thuc-hoan" className="scroll-mt-24 space-y-4">
        <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
          Điều 11. Phương thức hoàn tiền
        </Title>
        <p className="text-text-muted leading-relaxed">
          Các khoản hoàn được thực hiện tự động theo hệ thống hiện được ghi nhận vào Số dư Nexus.
        </p>
        <p className="text-text-muted leading-relaxed">
          Nexus hiện không cung cấp chức năng tự động chuyển khoản hoàn tiền từ Số dư Nexus về tài khoản ngân hàng của người dùng.
        </p>
        <p className="text-text-muted leading-relaxed">
          Trường hợp pháp luật hoặc thỏa thuận riêng áp dụng cho một giao dịch cụ thể yêu cầu hình thức xử lý khác, Nexus thực hiện theo nghĩa vụ tương ứng.
        </p>
      </section>

      <section id="dieu-12-khong-rut-tien" className="scroll-mt-24 space-y-4">
        <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
          Điều 12. Không cung cấp chức năng rút tiền
        </Title>
        <p className="text-text-muted leading-relaxed">
          Nexus hiện không cung cấp dịch vụ withdrawal hoặc chức năng rút Số dư Nexus về tài khoản ngân hàng.
        </p>
        <p className="text-text-muted leading-relaxed">
          Do đó, Nexus không áp dụng mức rút tối thiểu, thời gian xử lý rút tiền, xác minh tài khoản ngân hàng hoặc quy trình KYC dành cho withdrawal.
        </p>
        <p className="text-text-muted leading-relaxed">
          Nếu các chức năng này được bổ sung trong tương lai, Nexus sẽ cập nhật hệ thống và Chính sách trước khi đưa vào sử dụng.
        </p>
      </section>

      <section id="dieu-13-khieu-nai" className="scroll-mt-24 space-y-4">
        <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
          Điều 13. Khiếu nại và tranh chấp giao dịch
        </Title>
        <p className="text-text-muted leading-relaxed">
          Khi phát hiện giao dịch không chính xác, người dùng có quyền yêu cầu Nexus kiểm tra.
        </p>
        <p className="text-text-muted leading-relaxed">
          Để phục vụ quá trình đối chiếu, Nexus có thể yêu cầu người dùng cung cấp email tài khoản, mã Case hoặc mã đơn hàng, thời điểm giao dịch, số tiền và chứng từ có liên quan.
        </p>
        <p className="text-text-muted leading-relaxed">
          Việc người dùng khiếu nại một giao dịch không mặc nhiên bị xem là hành vi gian lận.
        </p>
        <p className="text-text-muted leading-relaxed">
          Trong trường hợp có bằng chứng hợp lý về giao dịch gian lận hoặc hành vi lợi dụng hệ thống, Nexus có quyền áp dụng biện pháp bảo vệ phù hợp và cung cấp thông tin cần thiết cho ngân hàng, nhà cung cấp dịch vụ thanh toán hoặc cơ quan có thẩm quyền theo quy định pháp luật.
        </p>
      </section>

      <section id="dieu-14-gia-dich-vu" className="scroll-mt-24 space-y-4">
        <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
          Điều 14. Giá dịch vụ
        </Title>
        <p className="text-text-muted leading-relaxed">
          Giá dịch vụ hoặc Credit được hiển thị cho người dùng trước thời điểm xác nhận giao dịch.
        </p>
        <p className="text-text-muted leading-relaxed">
          Việc Nexus thay đổi giá trong tương lai không làm thay đổi giá của giao dịch đã hoàn tất trước thời điểm thay đổi, trừ trường hợp có thỏa thuận khác phù hợp với pháp luật.
        </p>
      </section>

      <section id="dieu-15-sua-doi" className="scroll-mt-24 space-y-4">
        <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
          Điều 15. Sửa đổi Chính sách
        </Title>
        <p className="text-text-muted leading-relaxed">
          Nexus có thể sửa đổi Chính sách này khi cơ chế thanh toán, cấu trúc dịch vụ hoặc quy định pháp luật thay đổi.
        </p>
        <p className="text-text-muted leading-relaxed">
          Các thay đổi quan trọng sẽ được công bố trước khi áp dụng và không được sử dụng để làm mất quyền đã phát sinh từ giao dịch trước đó trái với pháp luật.
        </p>
      </section>

      <section id="dieu-16-lien-he" className="scroll-mt-24 space-y-4">
        <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
          Điều 16. Liên hệ
        </Title>
        <p className="text-text-muted leading-relaxed">
          Mọi yêu cầu liên quan đến thanh toán, Credit hoặc hoàn tiền được gửi tới:
        </p>
        <p className="text-text-muted font-medium">
          <strong className="text-brand">phungluuhoanglong@gmail.com</strong>
        </p>
      </section>
    </>
  );
}
