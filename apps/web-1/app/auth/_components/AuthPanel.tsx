"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button, TextInput, UnstyledButton } from "@mantine/core";
import { AlertCircle } from "lucide-react";
import { getAuthRedirectUrl } from "../get-auth-redirect";
import { useEmailOtpLogin } from "../hooks/use-email-otp-login";
import { useGoogleSignIn } from "../hooks/use-google-sign-in";
import { EmailOtpStep } from "./EmailOtpStep";
import { GoogleButton } from "./GoogleButton";

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

type Step = "idle" | "email" | "otp";

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

  const goIdle = () => {
    setStep("idle");
    otp.clearError();
  };

  const handleOtpStart = async () => {
    if (!emailValid || busy) return;
    const sent = await otp.send(normalizedEmail);
    if (sent) setStep("otp");
  };

  return (
    <div className="w-full font-body text-xs text-text-app space-y-4">
      <div className="text-center space-y-1 pb-1">
        <h1 className="font-heading text-xl font-bold tracking-tight text-text-app sm:text-2xl">
          Đăng nhập vào Nexus
        </h1>
        {step === "otp" && (
          <p className="text-xs text-text-muted sm:text-sm">
            Mã đã gửi đến {normalizedEmail}
          </p>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-danger-soft border border-danger/20 text-danger rounded-lg text-xs font-body">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {step === "idle" && (
        <div className="space-y-3">
          <GoogleButton onClick={() => void google.signInGoogle()} loading={google.loading}>
            Tiếp tục với Google
          </GoogleButton>

          <Button
            fullWidth
            radius="md"
            size="md"
            variant="default"
            className="h-10 cursor-pointer font-medium border-border-app hover:bg-surface-soft transition-colors"
            onClick={() => setStep("email")}
          >
            Tiếp tục với Email
          </Button>
        </div>
      )}

      {step === "email" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleOtpStart();
          }}
        >
          <div className="flex flex-col gap-4">
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
              className="h-10 cursor-pointer font-semibold mt-4"
              disabled={!emailValid || busy}
              loading={otp.sending}
            >
              Tiếp tục
            </Button>
            <div className="text-center">
              <UnstyledButton
                type="button"
                disabled={busy}
                onClick={goIdle}
                className="text-xs sm:text-sm font-normal text-text-muted hover:text-text-app cursor-pointer transition-colors"
                style={{ color: "var(--mantine-color-dimmed)" }}
              >
                Quay lại
              </UnstyledButton>
            </div>
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
          onBack={() => setStep("email")}
        />
      )}
    </div>
  );
}
