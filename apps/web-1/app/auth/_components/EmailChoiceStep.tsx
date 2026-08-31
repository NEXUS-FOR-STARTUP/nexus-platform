"use client";

import { Button, Stack, TextInput, UnstyledButton } from "@mantine/core";

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
      onSubmit={(e) => {
        e.preventDefault();
        if (canAct) onPasswordChoice();
      }}
    >
      <Stack gap="md">
        <TextInput
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.currentTarget.value)}
          label="Địa chỉ Email"
          placeholder="name@example.com"
          required
          variant="default"
          radius="md"
          size="md"
          autoComplete="email"
          autoFocus
          disabled={busy}
          classNames={{
            input: "border-border-app focus:border-brand",
          }}
        />

        <Button
          type="submit"
          fullWidth
          radius="md"
          size="md"
          color="brand"
          className="h-10 cursor-pointer font-semibold mt-2"
          disabled={!canAct}
        >
          Đăng nhập mật khẩu
        </Button>

        <Button
          type="button"
          fullWidth
          radius="md"
          size="md"
          variant="default"
          className="h-10 cursor-pointer font-medium border-border-app"
          disabled={!canAct}
          loading={otpBusy}
          onClick={onOtpLogin}
        >
          Đăng nhập OTP
        </Button>

        <div className="text-center">
          <UnstyledButton
            type="button"
            disabled={busy}
            onClick={onBack}
            className="text-xs sm:text-sm font-normal text-text-muted hover:text-text-app cursor-pointer transition-colors"
            style={{ color: "var(--mantine-color-dimmed)" }}
          >
            Quay lại
          </UnstyledButton>
        </div>
      </Stack>
    </form>
  );
}
