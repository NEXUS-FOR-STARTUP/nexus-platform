"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button, Divider, Group, TextInput } from "@mantine/core";
import { AlertCircle } from "lucide-react";
import { getAuthRedirectUrl } from "../get-auth-redirect";
import { useEmailOtpLogin } from "../hooks/use-email-otp-login";
import { useGoogleSignIn } from "../hooks/use-google-sign-in";
import { EmailOtpStep } from "./EmailOtpStep";
import { GoogleButton } from "./GoogleButton";

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

type Step = "idle" | "otp";

export default function AuthPanel() {
  const searchParams = useSearchParams();
  const returnUrl = getAuthRedirectUrl(searchParams);
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<Step>("idle");
  const otp = useEmailOtpLogin(returnUrl);
  const google = useGoogleSignIn(returnUrl);

  const error = otp.error;
  const busy = otp.sending || otp.verifying || google.loading;
  const normalizedEmail = email.trim().toLowerCase();
  const emailValid = EMAIL_REGEX.test(normalizedEmail);

  const handleOtpStart = async () => {
    if (!emailValid || busy) return;
    const sent = await otp.send(normalizedEmail);
    if (sent) setStep("otp");
  };

  return (
    <div className="w-full font-body text-xs text-text-app space-y-4">
      <div className="text-center space-y-1">
        <h1 className="font-heading text-xl font-bold tracking-tight text-text-app sm:text-2xl">
          Đăng nhập vào Nexus
        </h1>
        <p className="text-xs text-text-muted sm:text-sm">
          {step === "otp"
            ? `Mã đã gửi đến ${normalizedEmail}`
            : "Đăng nhập hoặc tạo tài khoản để tiếp tục"}
        </p>
      </div>

      {step === "idle" && (
        <Group grow>
          <GoogleButton onClick={() => void google.signInGoogle()} loading={google.loading}>
            Tiếp tục với Google
          </GoogleButton>
        </Group>
      )}

      {step === "idle" && (
        <div className="py-0.5">
          <Divider
            label="Hoặc tiếp tục bằng email"
            labelPosition="center"
            styles={{
              label: {
                fontSize: "14px",
                fontWeight: 400,
                color: "var(--mantine-color-dimmed)",
              },
            }}
            className="border-border-app"
          />
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 p-3 bg-danger-soft border border-danger/20 text-danger rounded-lg text-xs font-body">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {step === "idle" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleOtpStart();
          }}
        >
          <div className="space-y-4">
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
              disabled={busy}
              classNames={{
                input: "border-border-app focus:border-brand",
              }}
            />
            <Button
              type="submit"
              fullWidth
              radius="xl"
              size="md"
              color="brand"
              className="h-10 cursor-pointer font-semibold"
              disabled={!emailValid || busy}
              loading={otp.sending}
            >
              Đăng nhập
            </Button>
            <p
              className="text-center"
              style={{
                fontSize: "14px",
                fontWeight: 400,
                color: "var(--mantine-color-dimmed)",
              }}
            >
              Tài khoản chưa đăng ký sẽ được tạo tự động
            </p>
          </div>
        </form>
      )}

      {step === "otp" && (
        <EmailOtpStep
          verifying={otp.verifying}
          sending={otp.sending}
          cooldown={otp.cooldown}
          onVerify={(code) => void otp.verify(normalizedEmail, code)}
          onResend={() => void otp.send(normalizedEmail)}
        />
      )}
    </div>
  );
}
