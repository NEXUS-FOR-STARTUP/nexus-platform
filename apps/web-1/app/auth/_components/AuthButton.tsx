"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import base from "@/components/landing/landing.module.css";
import s from "./auth.module.css";

interface AuthButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
  variant?: "primary" | "ghost";
  loading?: boolean;
  icon?: ReactNode;
}

/** Full-width pill button reusing the landing `.btn` look. */
export function AuthButton({
  variant = "primary",
  loading = false,
  icon,
  disabled,
  type = "button",
  children,
  ...props
}: AuthButtonProps) {
  const tone = variant === "primary" ? base.btnPrimary : base.btnGhost;
  return (
    <button
      type={type}
      className={`${base.btn} ${tone} ${base.btnBlock} ${s.btn}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Loader2 size={18} className={s.spin} aria-hidden="true" /> : icon}
      {children}
    </button>
  );
}
