import type { Metadata } from "next";
import PolicyDocumentLayout, { type TOCItem } from "@/components/policy/PolicyDocumentLayout";
import PrivacySections1 from "./_components/PrivacySections1";
import PrivacySections2 from "./_components/PrivacySections2";

export const metadata: Metadata = {
  title: "Chính sách Bảo vệ Dữ liệu Cá nhân | Nexus Platform",
  description:
    "Chính sách bảo vệ dữ liệu cá nhân của Nexus Platform — cách thu thập, lưu trữ, sử dụng, chia sẻ và bảo vệ dữ liệu người dùng.",
};

const privacyTOC: TOCItem[] = [
  { id: "dieu-1-pham-vi", title: "Điều 1. Phạm vi áp dụng" },
  { id: "dieu-2-ben-chiu-trach-nhiem", title: "Điều 2. Bên chịu trách nhiệm xử lý dữ liệu" },
  { id: "dieu-3-du-lieu-tai-khoan", title: "Điều 3. Dữ liệu tài khoản" },
  { id: "dieu-4-du-lieu-case", title: "Điều 4. Dữ liệu Case và dự án" },
  { id: "dieu-5-du-lieu-trao-doi", title: "Điều 5. Dữ liệu trao đổi" },
  { id: "dieu-6-du-lieu-thanh-toan", title: "Điều 6. Dữ liệu thanh toán" },
  { id: "dieu-7-du-lieu-ky-thuat", title: "Điều 7. Dữ liệu kỹ thuật và nhật ký hệ thống" },
  { id: "dieu-8-muc-dich", title: "Điều 8. Mục đích xử lý dữ liệu" },
  { id: "dieu-9-xu-ly-ai", title: "Điều 9. Xử lý dữ liệu bằng trí tuệ nhân tạo" },
  { id: "dieu-10-nha-cung-cap", title: "Điều 10. Nhà cung cấp dịch vụ" },
  { id: "dieu-11-xuyen-bien-gioi", title: "Điều 11. Xử lý dữ liệu ngoài lãnh thổ Việt Nam" },
  { id: "dieu-12-quyen-truy-cap", title: "Điều 12. Quyền truy cập dữ liệu" },
  { id: "dieu-13-luu-tru-tep", title: "Điều 13. Lưu trữ tệp" },
  { id: "dieu-14-thoi-gian-luu-tru", title: "Điều 14. Thời gian lưu trữ dữ liệu" },
  { id: "dieu-15-xoa-tai-khoan", title: "Điều 15. Xóa tài khoản" },
  { id: "dieu-16-quyen-chu-the", title: "Điều 16. Quyền của chủ thể dữ liệu" },
  { id: "dieu-17-cookie", title: "Điều 17. Cookie và cơ chế duy trì phiên" },
  { id: "dieu-18-bao-mat", title: "Điều 18. Biện pháp bảo mật" },
  { id: "dieu-19-nguoi-dung-chua-thanh-nien", title: "Điều 19. Người dùng chưa thành niên" },
  { id: "dieu-20-sua-doi", title: "Điều 20. Sửa đổi Chính sách" },
  { id: "dieu-21-lien-he", title: "Điều 21. Liên hệ" },
];

export default function PrivacyPage() {
  return (
    <PolicyDocumentLayout
      title="Chính sách Bảo vệ Dữ liệu Cá nhân"
      subtitle="Chính sách Bảo vệ Dữ liệu Cá nhân này quy định cách Nexus Platform thu thập, lưu trữ, sử dụng, chia sẻ và bảo vệ dữ liệu cá nhân của người dùng trong quá trình cung cấp dịch vụ."
      effectiveDate="22/09/2026"
      version="2026-09-v3.0"
      tocItems={privacyTOC}
    >
      <div className="space-y-10">
        <PrivacySections1 />
        <PrivacySections2 />
      </div>
    </PolicyDocumentLayout>
  );
}
