"use client";

import { TextInput } from "@mantine/core";
import { AuthButton } from "./AuthButton";
import s from "./auth.module.css";

interface EmailChoiceStepProps {
  email: string;
  setEmail: (val: string) => void;
  busy: boolean;
  otpBusy: boolean;
  emailValid: boolean;
  onPasswordChoice: () => void;
  onOtpLogin: () => void;
  onBack: () => void;
}

export function EmailChoiceStep({
  email,
  setEmail,
  busy,
  otpBusy,
  emailValid,
  onPasswordChoice,
  onOtpLogin,
  onBack,
}: EmailChoiceStepProps) {
  const canAct = emailValid && !busy;

  return (
    <form
      className={s.stack}
      onSubmit={(e) => {
        e.preventDefault();
        if (canAct) onPasswordChoice();
      }}
    >
      <TextInput
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.currentTarget.value)}
        label="Địa chỉ email"
        placeholder="name@example.com"
        required
        size="md"
        autoComplete="email"
        autoFocus
        disabled={busy}
        classNames={{ label: s.label, input: s.input }}
      />

      <AuthButton type="submit" disabled={!canAct}>
        Đăng nhập bằng mật khẩu
      </AuthButton>
      <div className={s.or}>hoặc</div>
      <AuthButton variant="ghost" disabled={!canAct} loading={otpBusy} onClick={onOtpLogin}>
        Đăng nhập bằng mã OTP
      </AuthButton>

      <button type="button" className={s.link} disabled={busy} onClick={onBack}>
        Quay lại
      </button>
    </form>
  );
}
