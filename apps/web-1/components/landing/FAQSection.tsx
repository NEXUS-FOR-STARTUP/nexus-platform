"use client";

import { Accordion } from "@mantine/core";

const faqItems = [
  {
    question: "Nexus phản biện ý tưởng như thế nào?",
    answer: "Nexus sử dụng AI phân tích tài liệu (link Drive của bạn) đối chiếu với các tiêu chí đánh giá checkpoint. Kết quả là bản báo cáo chi tiết chỉ ra các lỗ hổng lập luận, bằng chứng thiếu sót, và gợi ý giải pháp cải thiện.",
  },
  {
    question: "Báo cáo của Nexus có đảm bảo tôi sẽ pass checkpoint không?",
    answer: "Không. Nexus là công cụ phản biện và hỗ trợ hoàn thiện tài liệu, giúp bạn chuẩn bị tốt nhất. Kết quả cuối cùng phụ thuộc vào hội đồng đánh giá và khả năng thuyết trình của đội ngũ.",
  },
  {
    question: "Vai trò của Supporter trên hệ thống là gì?",
    answer: "Supporter là các chuyên gia, giảng viên hoặc mentor có kinh nghiệm. Họ sẽ xem xét bản draft phản biện của AI, điều chỉnh, bổ sung ý kiến thực tế để xuất bản báo cáo chất lượng nhất cho hồ sơ của bạn.",
  },
  {
    question: "Tôi có thể chỉnh sửa ý tưởng sau khi nhận phản biện không?",
    answer: "Có. Hệ thống hỗ trợ quy trình cập nhật phiên bản (v00, v01, v02...). Bạn có thể nộp bản chỉnh sửa dựa trên phản biện để chạy đánh giá vòng tiếp theo.",
  },
  {
    question: "Nexus bảo mật thông tin ý tưởng của tôi như thế nào?",
    answer: "Mọi thông tin ý tưởng và tài liệu Drive của bạn đều được bảo mật nghiêm ngặt. Chúng tôi chỉ sử dụng dữ liệu này cho mục đích phản biện và không chia sẻ cho bên thứ ba.",
  },
];

export default function FAQSection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-bg-app transition-colors duration-200">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12 space-y-4">
          <h2 className="font-heading text-h2 font-semibold text-text-app">Câu hỏi thường gặp (FAQ)</h2>
          <p className="font-body text-text-muted">
            Giải đáp các thắc mắc phổ biến về quy trình phản biện ý tưởng trên Nexus.
          </p>
        </div>

        <div className="bg-surface-app border border-border-app rounded-2xl p-6 md:p-8 shadow-sm">
          <Accordion multiple variant="separated" radius="md">
            {faqItems.map((item, index) => (
              <Accordion.Item key={index} value={`faq-${index}`}>
                <Accordion.Control className="font-heading font-medium text-text-app">
                  {item.question}
                </Accordion.Control>
                <Accordion.Panel className="font-body text-base text-text-muted leading-relaxed">
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
