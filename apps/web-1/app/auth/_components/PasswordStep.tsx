"use client";

import { Button, PasswordInput, Stack, UnstyledButton } from "@mantine/core";

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
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) onSubmit();
      }}
    >
      <Stack gap="md">
        <PasswordInput
          id="password"
          value={password}
          onChange={(e) => setPassword(e.currentTarget.value)}
          label="Mật khẩu"
          placeholder="Nhập mật khẩu (tối thiểu 8 ký tự)"
          error={passwordError}
          variant="default"
          radius="md"
          size="md"
          autoComplete="current-password"
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
          disabled={!canSubmit}
          loading={busy}
        >
          Đăng nhập
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
