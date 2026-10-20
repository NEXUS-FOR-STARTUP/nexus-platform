import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/ssr";
import base from "@/components/landing/landing.module.css";
import s from "@/components/layout/statusPage.module.css";

export default function NotFound() {
  return (
    <div className={`${base.landing} ${s.root}`}>
      <main className={s.col}>
        <Image src="/landing/logo.svg" alt="Nexus" width={71} height={40} className={s.logo} unoptimized />
        <p className={s.code}>Lỗi 404</p>
        <h1 className={s.title}>Không tìm thấy trang</h1>
        <p className={s.text}>
          Đường dẫn bạn truy cập có thể đã thay đổi hoặc không tồn tại. Hãy quay về trang chủ hoặc liên hệ hỗ trợ nếu bạn nghĩ đây là nhầm lẫn.
        </p>
        <div className={s.actions}>
          <Link href="/" className={`${base.btn} ${base.btnPrimary}`}>
            Về trang chủ
            <ArrowRightIcon size={18} aria-hidden="true" />
          </Link>
        </div>
      </main>
    </div>
  );
}
