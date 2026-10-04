"use client";

import { Accordion } from "@mantine/core";
import Link from "next/link";
import type { ReactNode } from "react";

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
    question: "Gói 79.000đ bao gồm những gì và được sử dụng như thế nào?",
    answer: "Mỗi gói cung cấp 2 lượt đánh giá cho dự án. Lượt 1 giúp nhóm phát hiện các điểm thiếu logic và lỗ hổng ban đầu. Sau khi chỉnh sửa tài liệu, nhóm sử dụng lượt 2 để đánh giá lại phiên bản mới xem đã khắc phục triệt để chưa.",
  },
  {
    question: "Tôi có thể chỉnh sửa dự án sau khi nhận báo cáo phản biện không?",
    answer: "Có. Hệ thống hỗ trợ lưu trữ theo từng phiên bản (Phiên bản 1, Phiên bản 2, Phiên bản 3...). Bạn có thể tải lên tài liệu mới để thực hiện lần đánh giá tiếp theo.",
  },
  {
    question: "Tài liệu dự án của tôi được xử lý như thế nào?",
    answer: (
      <span>
        Nexus sử dụng tài liệu nhóm cung cấp để thực hiện đánh giá. Trong quá trình xử lý, nội dung có thể được truyền tới các nhà cung cấp công nghệ hỗ trợ việc phân tích. Xem chi tiết tại{" "}
        <Link href="/privacy" className="text-brand hover:underline font-medium">
          Chính sách bảo mật
        </Link>
        .
      </span>
    ),
  },
];

export default function FAQSection() {
  return (
    <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 bg-bg-app transition-colors duration-200">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12 space-y-4">
          <h2 className="font-heading text-3xl font-semibold text-text-app">Câu hỏi thường gặp (FAQ)</h2>
          <p className="font-body text-text-muted">
            Giải đáp các thắc mắc phổ biến về quy trình đánh giá và phản biện dự án trên Nexus.
          </p>
        </div>

        <div className="bg-surface-app border border-border-app rounded-2xl p-6 md:p-8">
          <Accordion multiple variant="separated" radius="md">
            {faqItems.map((item, index) => (
              <Accordion.Item key={index} value={`faq-${index}`}>
                <Accordion.Control className="font-heading font-medium text-text-app">
                  {item.question}
                </Accordion.Control>
                <Accordion.Panel className="font-body text-sm text-text-muted leading-relaxed">
                  {item.answer}
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
