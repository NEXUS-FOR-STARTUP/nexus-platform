"use client";

import Link from "next/link";
import { Checkbox } from "@mantine/core";
import { AuthButton } from "./AuthButton";
import { GoogleButton } from "./GoogleButton";
import s from "./auth.module.css";

interface AuthIdleStepProps {
  agreed: boolean;
  setAgreed: (val: boolean) => void;
  busy: boolean;
  googleLoading: boolean;
  onGoogle: () => void;
  onEmail: () => void;
}

export function AuthIdleStep({
  agreed,
  setAgreed,
  busy,
  googleLoading,
  onGoogle,
  onEmail,
}: AuthIdleStepProps) {
  return (
    <div className={s.stack}>
      <GoogleButton onClick={onGoogle} loading={googleLoading} disabled={!agreed || busy}>
        Tiếp tục với Google
      </GoogleButton>
      <AuthButton variant="ghost" onClick={onEmail} disabled={!agreed || busy}>
        Tiếp tục với Email
      </AuthButton>

      <Checkbox
        checked={agreed}
        onChange={(e) => setAgreed(e.currentTarget.checked)}
        disabled={busy}
        radius="sm"
        size="md"
        color="brand"
        label={
          <span className={s.consent}>
            Bằng việc tiếp tục, bạn đồng ý với{" "}
            <Link href="/terms" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
              Điều khoản dịch vụ
            </Link>{" "}
            và{" "}
            <Link href="/privacy" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
              Chính sách bảo mật
            </Link>{" "}
            của Nexus.
          </span>
        }
      />
    </div>
  );
}
