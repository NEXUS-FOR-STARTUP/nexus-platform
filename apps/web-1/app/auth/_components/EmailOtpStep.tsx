"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Center, Group, PinInput, Stack, Text, UnstyledButton } from "@mantine/core";
import { OTP_LENGTH } from "../hooks/use-email-otp-login";

interface EmailOtpStepProps {
  verifying: boolean;
  sending: boolean;
  cooldown: number;
  onVerify: (otp: string) => void;
  onResend: () => void;
}

export function EmailOtpStep({
  verifying,
  sending,
  cooldown,
  onVerify,
  onResend,
}: EmailOtpStepProps) {
  const [code, setCode] = useState("");
  const submittedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!verifying) submittedRef.current = null;
  }, [verifying]);

  const submit = (value: string) => {
    if (value.length !== OTP_LENGTH || verifying) return;
    if (submittedRef.current === value) return;
    submittedRef.current = value;
    onVerify(value);
  };

  return (
    <Stack gap="sm">
      <Center>
        <PinInput
          length={OTP_LENGTH}
          type="number"
          size="md"
          radius="md"
          oneTimeCode
          autoFocus
          disabled={verifying}
          ariaLabel="Mã đăng nhập"
          onChange={setCode}
          onComplete={submit}
        />
      </Center>

      <Group justify="flex-end">
        {cooldown > 0 ? (
          <Text size="xs" c="dimmed">
            Gửi lại ({cooldown}s)
          </Text>
        ) : (
          <UnstyledButton
            type="button"
            disabled={sending || verifying}
            onClick={onResend}
            className="text-xs font-medium text-brand cursor-pointer disabled:opacity-50"
          >
            {sending ? "Đang gửi..." : "Gửi lại mã"}
          </UnstyledButton>
        )}
      </Group>

      <Button
        fullWidth
        radius="xl"
        size="md"
        color="brand"
        className="h-10 cursor-pointer font-semibold"
        loading={verifying}
        disabled={code.length !== OTP_LENGTH}
        onClick={() => submit(code)}
      >
        Tiếp tục
      </Button>
    </Stack>
  );
}
