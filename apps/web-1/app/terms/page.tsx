import type { Metadata } from "next";
import PolicyDocumentLayout, { type TOCItem } from "@/components/policy/PolicyDocumentLayout";
import TermsSections1 from "./_components/TermsSections1";
import TermsSections2 from "./_components/TermsSections2";

export const metadata: Metadata = {
  title: "Điều khoản Sử dụng Dịch vụ | Nexus Platform",
  description:
    "Điều khoản sử dụng dịch vụ Nexus Platform — quyền, nghĩa vụ và trách nhiệm của người dùng khi truy cập và sử dụng Nexus.",
};

const termsTOC: TOCItem[] = [
  { id: "dieu-1-gioi-thieu", title: "Điều 1. Giới thiệu về Nexus Platform" },
  { id: "dieu-2-tai-khoan", title: "Điều 2. Tài khoản người dùng" },
  { id: "dieu-3-ho-so-ho-tro", title: "Điều 3. Hồ sơ hỗ trợ" },
  { id: "dieu-4-noi-dung-nguoi-dung", title: "Điều 4. Nội dung do người dùng cung cấp" },
  { id: "dieu-5-so-huu-tri-tue", title: "Điều 5. Quyền sở hữu trí tuệ của Nexus" },
  { id: "dieu-6-tri-tue-nhan-tao", title: "Điều 6. Việc sử dụng trí tuệ nhân tạo" },
  { id: "dieu-7-nguoi-ho-tro", title: "Điều 7. Người hỗ trợ chuyên môn và quyền truy cập" },
  { id: "dieu-8-liem-chinh", title: "Điều 8. Liêm chính học thuật" },
  { id: "dieu-9-thanh-toan", title: "Điều 9. Thanh toán và Credit" },
  { id: "dieu-10-hanh-vi", title: "Điều 10. Hành vi không được phép" },
  { id: "dieu-11-dinh-chi", title: "Điều 11. Đình chỉ hoặc chấm dứt quyền truy cập" },
  { id: "dieu-12-xoa-tai-khoan", title: "Điều 12. Xóa tài khoản" },
  { id: "dieu-13-tinh-kha-dung", title: "Điều 13. Tính khả dụng và thay đổi dịch vụ" },
  { id: "dieu-14-trach-nhiem", title: "Điều 14. Trách nhiệm của các bên" },
  { id: "dieu-15-sua-doi", title: "Điều 15. Sửa đổi Điều khoản" },
  { id: "dieu-16-luat-ap-dung", title: "Điều 16. Luật áp dụng và giải quyết tranh chấp" },
  { id: "dieu-17-lien-he", title: "Điều 17. Liên hệ" },
];

export default function TermsPage() {
  return (
    <PolicyDocumentLayout
      title="Điều khoản Sử dụng Dịch vụ"
      subtitle="Điều khoản Sử dụng Dịch vụ này quy định quyền, nghĩa vụ và trách nhiệm của người dùng khi truy cập và sử dụng Nexus Platform. Việc tạo tài khoản, truy cập hoặc sử dụng bất kỳ chức năng nào của Nexus đồng nghĩa với việc người dùng xác nhận đã đọc, hiểu và đồng ý tuân thủ Điều khoản này cùng các chính sách có liên quan được công bố trên Nền tảng."
      effectiveDate="22/09/2026"
      version="2026-09-v3.0"
      tocItems={termsTOC}
    >
      <div className="space-y-10">
        <TermsSections1 />
        <TermsSections2 />
      </div>
    </PolicyDocumentLayout>
  );
}
