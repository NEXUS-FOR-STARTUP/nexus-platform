import type { Metadata } from "next";
import PolicyDocumentLayout, { type TOCItem } from "@/components/policy/PolicyDocumentLayout";
import FairUseSections1 from "./_components/FairUseSections1";
import FairUseSections2 from "./_components/FairUseSections2";

export const metadata: Metadata = {
  title: "Chính sách Vận hành & Sử dụng Công bằng | Nexus Platform",
  description:
    "Chính sách vận hành và sử dụng công bằng của Nexus Platform — nguyên tắc sử dụng, phòng chống lạm dụng, tiến độ xử lý Case và xử lý hành vi vi phạm.",
};

const fairUseTOC: TOCItem[] = [
  { id: "dieu-1-nguyen-tac", title: "Điều 1. Nguyên tắc sử dụng" },
  { id: "dieu-2-su-dung-hop-phap", title: "Điều 2. Sử dụng hợp pháp" },
  { id: "dieu-3-lam-dung", title: "Điều 3. Lạm dụng hệ thống" },
  { id: "dieu-4-tai-khoan-uu-dai", title: "Điều 4. Tài khoản và chương trình ưu đãi" },
  { id: "dieu-5-tuong-tac-ai", title: "Điều 5. Tương tác với hệ thống AI" },
  { id: "dieu-6-tep-tai-len", title: "Điều 6. Tệp tải lên" },
  { id: "dieu-7-trao-doi-supporter", title: "Điều 7. Trao đổi với Supporter" },
  { id: "dieu-8-liem-chinh", title: "Điều 8. Liêm chính học thuật" },
  { id: "dieu-9-tien-do-xu-ly", title: "Điều 9. Tiến độ xử lý Case" },
  { id: "dieu-10-thu-tu-xu-ly", title: "Điều 10. Thứ tự xử lý Case" },
  { id: "dieu-11-bo-sung-revision", title: "Điều 11. Bổ sung thông tin và revision" },
  { id: "dieu-12-hoan-tat-case", title: "Điều 12. Hoàn tất Case" },
  { id: "dieu-13-huy-tu-choi", title: "Điều 13. Hủy hoặc từ chối Case" },
  { id: "dieu-14-xu-ly-vi-pham", title: "Điều 14. Xử lý hành vi vi phạm" },
  { id: "dieu-15-quyen-loi-tai-chinh", title: "Điều 15. Quyền lợi tài chính khi tài khoản vi phạm" },
  { id: "dieu-16-khieu-nai", title: "Điều 16. Khiếu nại" },
  { id: "dieu-17-sua-doi", title: "Điều 17. Sửa đổi Chính sách" },
];

export default function FairUsePolicyPage() {
  return (
    <PolicyDocumentLayout
      title="Chính sách Vận hành & Sử dụng Công bằng"
      subtitle="Chính sách Vận hành & Sử dụng Công bằng quy định các nguyên tắc sử dụng Nexus Platform nhằm duy trì tính ổn định của hệ thống, bảo vệ quyền lợi của người dùng và Supporter, đồng thời hạn chế hành vi lạm dụng tài nguyên."
      effectiveDate="22/09/2026"
      version="2026-09-v3.0"
      tocItems={fairUseTOC}
    >
      <div className="space-y-10">
        <FairUseSections1 />
        <FairUseSections2 />
      </div>
    </PolicyDocumentLayout>
  );
}
