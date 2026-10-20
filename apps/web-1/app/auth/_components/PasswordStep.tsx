"use client";

import { PasswordInput } from "@mantine/core";
import { AuthButton } from "./AuthButton";
import s from "./auth.module.css";

interface PasswordStepProps {
  password: string;
  setPassword: (val: string) => void;
  busy: boolean;
  onSubmit: () => void;
  onBack: () => void;
}

export function PasswordStep({
  password,
  setPassword,
  busy,
  onSubmit,
  onBack,
}: PasswordStepProps) {
  const passwordError =
    password.length > 0 && password.length < 8
      ? "Mật khẩu phải có ít nhất 8 ký tự"
      : undefined;
  const canSubmit = password.length >= 8 && !passwordError && !busy;

  return (
    <form
      className={s.stack}
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) onSubmit();
      }}
    >
      <PasswordInput
        id="password"
        value={password}
        onChange={(e) => setPassword(e.currentTarget.value)}
        label="Mật khẩu"
        placeholder="Nhập mật khẩu (tối thiểu 8 ký tự)"
        error={passwordError}
        size="md"
        autoComplete="current-password"
        autoFocus
        disabled={busy}
        classNames={{ label: s.label, input: s.input, innerInput: s.input }}
      />

      <AuthButton type="submit" disabled={!canSubmit} loading={busy}>
        Đăng nhập
      </AuthButton>

      <button type="button" className={s.link} disabled={busy} onClick={onBack}>
        Quay lại
      </button>
    </form>
  );
}
