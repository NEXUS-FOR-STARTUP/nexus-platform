import { Title } from "@mantine/core";

export default function FairUseSections1() {
  return (
    <>
      <section id="dieu-1-nguyen-tac" className="scroll-mt-24 space-y-4">
        <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
          Điều 1. Nguyên tắc sử dụng
        </Title>
        <p className="text-text-muted leading-relaxed">
          Người dùng có quyền sử dụng các chức năng Nexus trong phạm vi dịch vụ được cung cấp và theo các điều kiện hiển thị tại thời điểm sử dụng.
        </p>
        <p className="text-text-muted leading-relaxed">
          Việc sử dụng bình thường, thử nghiệm cách đặt câu hỏi, phản biện kết quả AI, yêu cầu giải thích hoặc gửi các nội dung hợp pháp không bị xem là hành vi lạm dụng chỉ vì làm phát sinh nhiều tương tác với hệ thống.
        </p>
        <p className="text-text-muted leading-relaxed">
          Chính sách này chủ yếu áp dụng đối với các hành vi có chủ đích gây ảnh hưởng tới an toàn, tính ổn định hoặc tính công bằng trong việc sử dụng Nexus.
        </p>
      </section>

      <section id="dieu-2-su-dung-hop-phap" className="scroll-mt-24 space-y-4">
        <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
          Điều 2. Sử dụng hợp pháp
        </Title>
        <p className="text-text-muted leading-relaxed">
          Người dùng không được sử dụng Nexus để thực hiện hành vi trái pháp luật, xâm phạm dữ liệu cá nhân hoặc tài sản trí tuệ của người khác, phát tán mã độc hoặc sử dụng hệ thống như công cụ phục vụ hoạt động gây hại trái pháp luật.
        </p>
        <p className="text-text-muted leading-relaxed">
          Người dùng chỉ được tải lên những tài liệu mà mình có quyền sử dụng và cung cấp cho Nexus xử lý.
        </p>
      </section>

      <section id="dieu-3-lam-dung" className="scroll-mt-24 space-y-4">
        <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
          Điều 3. Lạm dụng hệ thống
        </Title>
        <p className="text-text-muted leading-relaxed">
          Người dùng không được cố ý gửi lượng lớn request nhằm gây quá tải, né tránh giới hạn kỹ thuật, sử dụng bot để phá hoạt động bình thường của hệ thống, truy cập trái phép Case hoặc endpoint, tìm cách lấy dữ liệu không thuộc quyền truy cập hoặc khai thác lỗ hổng để gây thiệt hại.
        </p>
        <p className="text-text-muted leading-relaxed">
          Việc tìm cách lấy credential, secret, prompt nội bộ hoặc dữ liệu của người dùng khác cũng được xem là hành vi vi phạm.
        </p>
        <p className="text-text-muted leading-relaxed">
          Nexus áp dụng một số giới hạn tần suất yêu cầu đối với những chức năng có nguy cơ bị spam hoặc lạm dụng.
        </p>
      </section>

      <section id="dieu-4-tai-khoan-uu-dai" className="scroll-mt-24 space-y-4">
        <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
          Điều 4. Tài khoản và chương trình ưu đãi
        </Title>
        <p className="text-text-muted leading-relaxed">
          Nexus có thể cung cấp tính năng miễn phí, Credit khuyến khích hoặc chương trình ưu đãi theo từng thời kỳ.
        </p>
        <p className="text-text-muted leading-relaxed">
          Điều kiện và giới hạn của mỗi chương trình được công bố tại nơi áp dụng. Nexus không mặc định áp dụng giới hạn ba Case miễn phí trong toàn bộ vòng đời tài khoản nếu giới hạn này không được công bố và hệ thống không thực thi tại thời điểm sử dụng.
        </p>
        <p className="text-text-muted leading-relaxed">
          Người dùng không được tạo hoặc sử dụng nhiều tài khoản với mục đích chủ yếu là né tránh quota hoặc lợi dụng chương trình ưu đãi.
        </p>
      </section>

      <section id="dieu-5-tuong-tac-ai" className="scroll-mt-24 space-y-4">
        <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
          Điều 5. Tương tác với hệ thống AI
        </Title>
        <p className="text-text-muted leading-relaxed">
          Người dùng có quyền đặt câu hỏi, thử nhiều cách diễn đạt, yêu cầu AI giải thích hoặc phản biện kết quả.
        </p>
        <p className="text-text-muted leading-relaxed">
          Những hành vi này không bị xem là prompt injection hoặc hành vi vi phạm chỉ vì chúng kiểm tra khả năng của hệ thống.
        </p>
        <p className="text-text-muted leading-relaxed">
          Tuy nhiên, người dùng không được cố ý sử dụng prompt hoặc kỹ thuật tương tự nhằm lấy credential, secret, dữ liệu của người dùng khác, truy cập tệp ngoài quyền hạn hoặc phá vỡ cơ chế phân quyền.
        </p>
      </section>

      <section id="dieu-6-tep-tai-len" className="scroll-mt-24 space-y-4">
        <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
          Điều 6. Tệp tải lên
        </Title>
        <p className="text-text-muted leading-relaxed">
          Người dùng không được tải lên mã độc, công cụ khai thác hệ thống, dữ liệu bất hợp pháp hoặc tài liệu mà mình không có quyền sử dụng.
        </p>
        <p className="text-text-muted leading-relaxed">
          Nexus có quyền từ chối, cách ly hoặc xóa tệp khi có căn cứ hợp lý cho rằng tệp gây nguy hiểm cho hệ thống hoặc vi phạm pháp luật.
        </p>
      </section>

      <section id="dieu-7-trao-doi-supporter" className="scroll-mt-24 space-y-4">
        <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
          Điều 7. Trao đổi với Supporter
        </Title>
        <p className="text-text-muted leading-relaxed">
          Người dùng và Supporter có trách nhiệm duy trì hoạt động trao đổi phù hợp với mục đích cung cấp dịch vụ.
        </p>
        <p className="text-text-muted leading-relaxed">
          Các hành vi đe dọa, quấy rối, spam, xúc phạm nghiêm trọng hoặc cố ý cản trở hoạt động hỗ trợ có thể dẫn đến việc Nexus áp dụng biện pháp xử lý.
        </p>
        <p className="text-text-muted leading-relaxed">
          Việc người dùng không đồng ý với đánh giá, phản biện Supporter hoặc khiếu nại về chất lượng dịch vụ không tự thân được coi là hành vi vi phạm.
        </p>
      </section>

      <section id="dieu-8-liem-chinh" className="scroll-mt-24 space-y-4">
        <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
          Điều 8. Liêm chính học thuật
        </Title>
        <p className="text-text-muted leading-relaxed">
          Nexus cung cấp công cụ phản biện và đánh giá chứ không thay thế trách nhiệm học thuật của người dùng.
        </p>
        <p className="text-text-muted leading-relaxed">
          Người dùng chịu trách nhiệm quyết định cách sử dụng báo cáo, đánh giá hoặc nội dung AI trong bài tập, báo cáo hoặc sản phẩm học thuật.
        </p>
        <p className="text-text-muted leading-relaxed">
          Trường hợp cơ sở giáo dục yêu cầu công khai việc sử dụng AI hoặc có quy định riêng về công cụ hỗ trợ, người dùng có trách nhiệm tuân thủ quy định đó.
        </p>
      </section>

      <section id="dieu-9-tien-do-xu-ly" className="scroll-mt-24 space-y-4">
        <Title order={2} className="font-display text-xl md:text-2xl font-bold text-text-main">
          Điều 9. Tiến độ xử lý Case
        </Title>
        <p className="text-text-muted leading-relaxed">
          Khi Supporter bắt đầu xử lý Case, hệ thống hiện ghi nhận thời hạn vận hành là 48 giờ kể từ thời điểm bắt đầu làm việc.
        </p>
        <p className="text-text-muted leading-relaxed">
          Khoảng thời gian này hiện được tính liên tục và không tự động loại trừ ngày nghỉ cuối tuần hoặc ngày lễ.
        </p>
        <p className="text-text-muted leading-relaxed">
          Thời hạn trên phục vụ việc quản lý vận hành và không tự động làm phát sinh quyền hoàn tiền chỉ vì bị vượt quá, do hệ thống hiện chưa triển khai cơ chế tự động phát hiện SLA breach và hoàn tiền.
        </p>
        <p className="text-text-muted leading-relaxed">
          Trường hợp việc chậm xử lý ảnh hưởng đáng kể tới dịch vụ đã thỏa thuận, người dùng có quyền gửi yêu cầu để Nexus kiểm tra và xử lý.
        </p>
      </section>
    </>
  );
}
