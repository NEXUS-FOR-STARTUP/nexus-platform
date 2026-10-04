import type { Metadata } from "next";
import PolicyDocumentLayout, { type TOCItem } from "@/components/policy/PolicyDocumentLayout";
import RefundSections1 from "./_components/RefundSections1";
import RefundSections2 from "./_components/RefundSections2";

export const metadata: Metadata = {
  title: "Chính sách Thanh toán & Hoàn tiền | Nexus Platform",
  description:
    "Chính sách thanh toán và hoàn tiền của Nexus Platform — nạp tiền, Số dư Nexus, Credit, hủy Case, hoàn tiền và giải quyết khiếu nại giao dịch.",
};

const refundTOC: TOCItem[] = [
  { id: "dieu-1-so-du-nexus", title: "Điều 1. Số dư Nexus" },
  { id: "dieu-2-nap-tien", title: "Điều 2. Nạp tiền" },
  { id: "dieu-3-giao-dich-khong-ghi-nhan", title: "Điều 3. Giao dịch không được tự động ghi nhận" },
  { id: "dieu-4-credit", title: "Điều 4. Credit" },
  { id: "dieu-5-mua-credit", title: "Điều 5. Mua Credit" },
  { id: "dieu-6-tieu-thu-credit", title: "Điều 6. Thời điểm tiêu thụ Credit" },
  { id: "dieu-7-hoan-credit-loi", title: "Điều 7. Hoàn Credit do lỗi tác vụ AI" },
  { id: "dieu-8-huy-case", title: "Điều 8. Người dùng hủy Case" },
  { id: "dieu-9-tu-choi-veto", title: "Điều 9. Trường hợp Nexus từ chối hoặc Veto Case" },
  { id: "dieu-10-case-hoan-tat", title: "Điều 10. Case đã hoàn tất" },
  { id: "dieu-11-phuong-thuc-hoan", title: "Điều 11. Phương thức hoàn tiền" },
  { id: "dieu-12-khong-rut-tien", title: "Điều 12. Không cung cấp chức năng rút tiền" },
  { id: "dieu-13-khieu-nai", title: "Điều 13. Khiếu nại và tranh chấp giao dịch" },
  { id: "dieu-14-gia-dich-vu", title: "Điều 14. Giá dịch vụ" },
  { id: "dieu-15-sua-doi", title: "Điều 15. Sửa đổi Chính sách" },
  { id: "dieu-16-lien-he", title: "Điều 16. Liên hệ" },
];

export default function RefundPolicyPage() {
  return (
    <PolicyDocumentLayout
      title="Chính sách Thanh toán & Hoàn tiền"
      subtitle="Chính sách Thanh toán & Hoàn tiền này quy định việc nạp tiền, ghi nhận Số dư Nexus, mua và sử dụng Credit, hủy Case, hoàn tiền và xử lý các vấn đề phát sinh từ giao dịch trên Nexus Platform."
      effectiveDate="22/09/2026"
      version="2026-09-v3.0"
      tocItems={refundTOC}
    >
      <div className="space-y-10">
        <RefundSections1 />
        <RefundSections2 />
      </div>
    </PolicyDocumentLayout>
  );
}
