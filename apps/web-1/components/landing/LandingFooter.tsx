import Link from "next/link";
import base from "./landing.module.css";
import s from "./landingSections.module.css";

const LEGAL_LINKS = [
  { href: "/privacy", label: "Chính sách bảo mật" },
  { href: "/terms", label: "Điều khoản sử dụng" },
  { href: "/refund-policy", label: "Thanh toán & Hoàn tiền" },
  { href: "/fair-use-policy", label: "Quy chế & Fair-Use" },
];

export default function LandingFooter() {
  return (
    <footer className={s.footer}>
      <div className={base.wrap}>
        <nav aria-label="Liên kết pháp lý">
          {LEGAL_LINKS.map((l) => (
            <Link key={l.href} href={l.href}>
              {l.label}
            </Link>
          ))}
        </nav>
        © {new Date().getFullYear()} Nexus Platform. Tất cả quyền được bảo lưu.
      </div>
    </footer>
  );
}
