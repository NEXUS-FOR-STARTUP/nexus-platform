import { Title } from "@mantine/core";

export default function FairUseSections2() {
  return (
    <>
      <section id="dieu-10-thu-tu-xu-ly" className="scroll-mt-24 space-y-4">
        <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
          Điều 10. Thứ tự xử lý Case
        </Title>
        <p className="text-text-muted leading-relaxed">
          Nexus hiện không vận hành hệ thống Priority Score tự động dựa trên giá gói, thời gian chờ, deadline của người dùng hoặc số vòng revision.
        </p>
        <p className="text-text-muted leading-relaxed">
          Việc phân công và xử lý Case được thực hiện thông qua quy trình quản trị và Supporter của Nexus.
        </p>
        <p className="text-text-muted leading-relaxed">
          Nếu Nexus bổ sung cơ chế ưu tiên tự động trong tương lai và cơ chế đó ảnh hưởng đáng kể tới quyền lợi của người dùng, Nexus sẽ cập nhật chính sách hoặc thông tin dịch vụ tương ứng.
        </p>
      </section>

      <section id="dieu-11-bo-sung-revision" className="scroll-mt-24 space-y-4">
        <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
          Điều 11. Bổ sung thông tin và revision
        </Title>
        <p className="text-text-muted leading-relaxed">
          Trong các trạng thái mà hệ thống cho phép, người dùng có thể gửi bổ sung tài liệu hoặc revision.
        </p>
        <p className="text-text-muted leading-relaxed">
          Hệ thống hiện không áp dụng một giới hạn cố định về tổng số lần revision tại cấp độ lifecycle của Case.
        </p>
        <p className="text-text-muted leading-relaxed">
          Việc gửi revision không tự thân phát sinh phí. Tuy nhiên, nếu revision làm phát sinh một vòng AI audit mới có tiêu thụ Credit thì việc tiêu thụ Credit được điều chỉnh theo Chính sách Thanh toán &amp; Hoàn tiền.
        </p>
      </section>

      <section id="dieu-12-hoan-tat-case" className="scroll-mt-24 space-y-4">
        <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
          Điều 12. Hoàn tất Case
        </Title>
        <p className="text-text-muted leading-relaxed">
          Khi báo cáo đã sẵn sàng, người dùng có một khoảng thời gian để xem xét kết quả và thực hiện các hành động mà hệ thống hỗ trợ.
        </p>
        <p className="text-text-muted leading-relaxed">
          Theo cơ chế hiện tại, nếu Case duy trì ở trạng thái báo cáo sẵn sàng trong bảy ngày mà không có hành động làm thay đổi trạng thái, hệ thống có thể tự động chuyển Case sang trạng thái hoàn tất.
        </p>
        <p className="text-text-muted leading-relaxed">
          Việc Case được hoàn tất không ngăn cản người dùng mở lại Case trong những trường hợp mà hệ thống cho phép.
        </p>
      </section>

      <section id="dieu-13-huy-tu-choi" className="scroll-mt-24 space-y-4">
        <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
          Điều 13. Hủy hoặc từ chối Case
        </Title>
        <p className="text-text-muted leading-relaxed">
          Người sở hữu Case có thể hủy Case trong các trạng thái được hệ thống cho phép.
        </p>
        <p className="text-text-muted leading-relaxed">
          Admin có thể từ chối hoặc Veto Case trong phạm vi quyền hạn và trạng thái tương ứng.
        </p>
        <p className="text-text-muted leading-relaxed">
          Hệ quả tài chính phát sinh từ việc hủy, từ chối hoặc Veto được điều chỉnh bởi Chính sách Thanh toán &amp; Hoàn tiền.
        </p>
      </section>

      <section id="dieu-14-xu-ly-vi-pham" className="scroll-mt-24 space-y-4">
        <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
          Điều 14. Xử lý hành vi vi phạm
        </Title>
        <p className="text-text-muted leading-relaxed">
          Tùy theo tính chất và mức độ vi phạm, Nexus có thể áp dụng một hoặc nhiều biện pháp gồm cảnh báo, yêu cầu chấm dứt hành vi, từ chối nội dung, từ chối Case, giới hạn một số chức năng, thu hồi phiên đăng nhập, đình chỉ hoặc chấm dứt tài khoản.
        </p>
        <p className="text-text-muted leading-relaxed">
          Nexus có quyền áp dụng biện pháp bảo vệ ngay mà không cần chờ hết thời hạn cảnh báo nếu điều đó cần thiết để ngăn truy cập trái phép, hạn chế thiệt hại đang xảy ra, bảo vệ dữ liệu, phòng chống gian lận hoặc thực hiện yêu cầu hợp pháp của cơ quan có thẩm quyền.
        </p>
        <p className="text-text-muted leading-relaxed">
          Nexus không tuyên bố áp dụng các cơ chế shadow-ban, device fingerprint blacklist, IP blacklist hoặc WAF blacklist như một phần mặc định của Chính sách này khi các cơ chế đó chưa được triển khai thực tế.
        </p>
      </section>

      <section id="dieu-15-quyen-loi-tai-chinh" className="scroll-mt-24 space-y-4">
        <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
          Điều 15. Quyền lợi tài chính khi tài khoản vi phạm
        </Title>
        <p className="text-text-muted leading-relaxed">
          Việc tài khoản hoặc Case vi phạm Chính sách này không mặc nhiên làm mất toàn bộ số tiền hoặc Credit của người dùng.
        </p>
        <p className="text-text-muted leading-relaxed">
          Việc xử lý giá trị còn lại được xác định theo trạng thái Case, Credit đã được sử dụng, giao dịch đã phát sinh, Chính sách Thanh toán &amp; Hoàn tiền và pháp luật áp dụng.
        </p>
      </section>

      <section id="dieu-16-khieu-nai" className="scroll-mt-24 space-y-4">
        <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
          Điều 16. Khiếu nại
        </Title>
        <p className="text-text-muted leading-relaxed">
          Người dùng có quyền yêu cầu Nexus xem xét lại nếu cho rằng Case hoặc tài khoản của mình bị xử lý không chính xác.
        </p>
        <p className="text-text-muted leading-relaxed">
          Yêu cầu được gửi tới <strong className="text-brand">phungluuhoanglong@gmail.com</strong> cùng các thông tin cần thiết để Nexus xác minh sự việc.
        </p>
      </section>

      <section id="dieu-17-sua-doi" className="scroll-mt-24 space-y-4">
        <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
          Điều 17. Sửa đổi Chính sách
        </Title>
        <p className="text-text-muted leading-relaxed">
          Nexus có thể cập nhật Chính sách này để phản ánh thay đổi của hệ thống, hoạt động vận hành hoặc rủi ro phát sinh.
        </p>
        <p className="text-text-muted leading-relaxed">
          Các thay đổi quan trọng sẽ được công bố trước khi áp dụng. Quy định mới không được sử dụng để xử lý hồi tố một hành vi phù hợp với chính sách tại thời điểm hành vi đó được thực hiện.
        </p>
      </section>
    </>
  );
}
