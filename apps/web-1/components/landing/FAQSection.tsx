import Link from "next/link";
import type { ReactNode } from "react";
import base from "./landing.module.css";
import s from "./landingSections.module.css";

const faqItems: Array<{ question: string; answer: ReactNode }> = [
  {
    question: "Nexus đánh giá và phản biện dự án như thế nào?",
    answer: "Nexus phân tích tài liệu slide hoặc đề cương do bạn tải lên trực tiếp, đối chiếu qua 5 nhóm tiêu chí đánh giá trọng yếu. Kết quả là bản báo cáo chi tiết chỉ ra các lỗ hổng lập luận, giả định thiếu căn cứ và gợi ý hướng hoàn thiện cụ thể.",
  },
  {
    question: "Báo cáo của Nexus có đảm bảo dự án sẽ đạt kết quả tốt khi bảo vệ không?",
    answer: "Không. Nexus là hệ thống phản biện hỗ trợ hoàn thiện tài liệu dự án trước khi trình bày. Kết quả bảo vệ thực tế phụ thuộc vào việc triển khai và năng lực thuyết trình của nhóm.",
  },
  {
    question: "Gói 79,000 VND bao gồm những gì và được sử dụng như thế nào?",
    answer: "Mỗi gói cung cấp 2 lượt đánh giá cho dự án. Lượt 1 giúp nhóm phát hiện các điểm thiếu logic và lỗ hổng ban đầu. Sau khi chỉnh sửa tài liệu, nhóm sử dụng lượt 2 để đánh giá lại phiên bản mới xem đã khắc phục triệt để chưa.",
  },
  {
    question: "Tôi có thể chỉnh sửa dự án sau khi nhận báo cáo phản biện không?",
    answer: "Có. Hệ thống hỗ trợ lưu trữ theo từng phiên bản (Phiên bản 1, Phiên bản 2, Phiên bản 3...). Bạn có thể tải lên tài liệu mới để thực hiện lần đánh giá tiếp theo.",
  },
  {
    question: "Tài liệu dự án của tôi được xử lý như thế nào?",
    answer: (
      <>
        Nexus sử dụng tài liệu nhóm cung cấp để thực hiện đánh giá. Trong quá trình xử lý, nội dung có thể được truyền tới các nhà cung cấp công nghệ hỗ trợ việc phân tích. Xem chi tiết tại{" "}
        <Link href="/privacy">Chính sách bảo mật</Link>.
      </>
    ),
  },
];

const COLUMN_SPLIT = 3;

function Column({ items }: { items: typeof faqItems }) {
  return (
    <div className={s.faqCol}>
      {items.map((item) => (
        <details key={item.question}>
          <summary>{item.question}</summary>
          <p>{item.answer}</p>
        </details>
      ))}
    </div>
  );
}

export default function FAQSection() {
  return (
    <section className={`${base.section} ${base.soft}`} id="faq">
      <div className={base.wrap}>
        <div className={base.head}>
          <h2 className={base.title}>Câu hỏi thường gặp</h2>
          <p>Giải đáp các thắc mắc phổ biến về quy trình đánh giá và phản biện dự án trên Nexus.</p>
        </div>
        <div className={s.faq}>
          <Column items={faqItems.slice(0, COLUMN_SPLIT)} />
          <Column items={faqItems.slice(COLUMN_SPLIT)} />
        </div>
      </div>
    </section>
  );
}
