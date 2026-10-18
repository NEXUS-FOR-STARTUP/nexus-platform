"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { getAuthRedirectUrl } from "../get-auth-redirect";
import { useEmailOtpLogin } from "../hooks/use-email-otp-login";
import { useEmailPasswordLogin } from "../hooks/use-email-password-login";
import { useGoogleSignIn } from "../hooks/use-google-sign-in";
import { AuthIdleStep } from "./AuthIdleStep";
import { EmailChoiceStep } from "./EmailChoiceStep";
import { EmailOtpStep } from "./EmailOtpStep";
import { PasswordStep } from "./PasswordStep";
import { RegisterConfirmModal } from "./RegisterConfirmModal";
import s from "./auth.module.css";

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

type Step = "idle" | "email" | "password" | "otp";

export default function AuthPanel() {
  const searchParams = useSearchParams();
  const returnUrl = getAuthRedirectUrl(searchParams);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [step, setStep] = useState<Step>("idle");
  const [registerOpen, setRegisterOpen] = useState(false);
  const otp = useEmailOtpLogin(returnUrl);
  const passLogin = useEmailPasswordLogin(returnUrl);
  const google = useGoogleSignIn(returnUrl);

  const error = otp.error || passLogin.error;
  const busy =
    otp.sending || otp.verifying || passLogin.loading || google.loading;
  const normalizedEmail = email.trim().toLowerCase();
  const emailValid = EMAIL_REGEX.test(normalizedEmail);

  const goIdle = () => {
    setStep("idle");
    otp.clearError();
    passLogin.clearError();
    setPassword("");
  };

  const handlePasswordChoice = () => {
    if (!emailValid || busy || !agreed) return;
    otp.clearError();
    passLogin.clearError();
    setStep("password");
  };

  const handleRegisterConfirm = async () => {
    const sent = await otp.send(normalizedEmail);
    if (sent) {
      setRegisterOpen(false);
      setStep("otp");
    }
  };

  const handlePasswordLogin = async () => {
    if (!emailValid || busy || !agreed || password.length < 8) return;
    otp.clearError();
    passLogin.clearError();
    const result = await passLogin.loginWithPassword(normalizedEmail, password);
    if (result === "not-exists") {
      setRegisterOpen(true);
    }
  };

  const handleOtpLogin = async () => {
    if (!emailValid || busy || !agreed) return;
    otp.clearError();
    passLogin.clearError();
    const sent = await otp.send(normalizedEmail);
    if (sent) setStep("otp");
  };

  return (
    <div className={s.stack}>
      <div className={s.head}>
        <h1 className={s.title}>Đăng nhập vào Nexus</h1>
        {step === "otp" && <p className={s.sub}>Mã đã gửi đến {normalizedEmail}</p>}
      </div>

      {error && (
        <div className={s.error} role="alert">
          <AlertCircle size={20} aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {step === "idle" && (
        <AuthIdleStep
          agreed={agreed}
          setAgreed={setAgreed}
          busy={busy}
          googleLoading={google.loading}
          onGoogle={() => void google.signInGoogle()}
          onEmail={() => setStep("email")}
        />
      )}

      {step === "email" && (
        <EmailChoiceStep
          email={email}
          setEmail={setEmail}
          busy={busy}
          otpBusy={otp.sending}
          emailValid={emailValid}
          onPasswordChoice={() => void handlePasswordChoice()}
          onOtpLogin={() => void handleOtpLogin()}
          onBack={goIdle}
        />
      )}

      {step === "password" && (
        <PasswordStep
          password={password}
          setPassword={setPassword}
          busy={passLogin.loading}
          onSubmit={() => void handlePasswordLogin()}
          onBack={() => {
            setPassword("");
            passLogin.clearError();
            setRegisterOpen(false);
            setStep("email");
          }}
        />
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

      <RegisterConfirmModal
        opened={registerOpen}
        email={normalizedEmail}
        loading={otp.sending}
        onClose={() => setRegisterOpen(false)}
        onConfirm={() => void handleRegisterConfirm()}
      />
    </div>
  );
}
