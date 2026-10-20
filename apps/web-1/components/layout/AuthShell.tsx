import React from "react";
import Link from "next/link";
import { Loader } from "@mantine/core";
import { ArrowLeft } from "@phosphor-icons/react/ssr";
import base from "../landing/landing.module.css";
import s from "./authShell.module.css";

interface AuthShellProps {
  children: React.ReactNode;
}

export default function AuthShell({ children }: AuthShellProps) {
  return (
    <div className={`${base.landing} ${s.root}`}>
      <main className={s.main}>
        <Link href="/" className={s.back}>
          <ArrowLeft size={18} aria-hidden="true" />
          Về trang chủ
        </Link>
        <section className={s.card}>{children}</section>
      </main>
    </div>
  );
}

export function AuthLoading({ label }: { label: string }) {
  return (
    <div className={s.loading} role="status">
      <Loader color="brand" size="lg" type="dots" />
      <span>{label}</span>
    </div>
  );
}
