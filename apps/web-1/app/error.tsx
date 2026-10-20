"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import base from "@/components/landing/landing.module.css";
import s from "@/components/layout/statusPage.module.css";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("System Error Boundary caught:", error);
  }, [error]);

  return (
    <div className={`${base.landing} ${s.root}`}>
      <main className={s.col}>
        <Image src="/landing/logo.svg" alt="Nexus" width={71} height={40} className={s.logo} unoptimized />
        <h1 className={s.title}>Đã xảy ra lỗi hệ thống</h1>
        <p className={s.text}>
          Hệ thống gặp sự cố ngoài ý muốn khi tải trang này. Bạn có thể thử tải lại, hoặc quay về trang chủ.
        </p>
        {error.digest && (
          <p className={s.digest}>
            Mã sự cố: <code>{error.digest}</code>
          </p>
        )}
        <div className={s.actions}>
          <button type="button" onClick={() => reset()} className={`${base.btn} ${base.btnPrimary}`}>
            Thử tải lại
          </button>
          <Link href="/" className={`${base.btn} ${base.btnGhost}`}>
            Về trang chủ
          </Link>
        </div>
      </main>
    </div>
  );
}
