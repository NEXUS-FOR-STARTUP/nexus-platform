"use client";

import { useEffect, useRef, useState } from "react";
import { Center, PinInput } from "@mantine/core";
import { OTP_LENGTH } from "../hooks/use-email-otp-login";
import { AuthButton } from "./AuthButton";
import s from "./auth.module.css";

interface EmailOtpStepProps {
  verifying: boolean;
  sending: boolean;
  cooldown: number;
  onVerify: (otp: string) => void;
  onResend: () => void;
  onBack: () => void;
}

export function EmailOtpStep({
  verifying,
  sending,
  cooldown,
  onVerify,
  onResend,
  onBack,
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
    <div className={s.stack}>
      <Center>
        <PinInput
          length={OTP_LENGTH}
          type="number"
          gap={6}
          size="md"
          oneTimeCode
          autoFocus
          disabled={verifying}
          ariaLabel="Mã đăng nhập"
          onChange={setCode}
          onComplete={submit}
          classNames={{ pinInput: s.pinCell, input: s.pin }}
        />
      </Center>

      <div className={s.resendRow}>
        {cooldown > 0 ? (
          <span>Gửi lại ({cooldown}s)</span>
        ) : (
          <button
            type="button"
            className={`${s.link} ${s.linkAccent}`}
            disabled={sending || verifying}
            onClick={onResend}
          >
            {sending ? "Đang gửi..." : "Gửi lại mã"}
          </button>
        )}
      </div>

      <AuthButton loading={verifying} disabled={code.length !== OTP_LENGTH} onClick={() => submit(code)}>
        Tiếp tục
      </AuthButton>

      <button type="button" className={s.link} disabled={verifying} onClick={onBack}>
        Quay lại
      </button>
    </div>
  );
}
