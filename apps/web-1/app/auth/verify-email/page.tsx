"use client";

/**
 * @deprecated Legacy standalone email verification page.
 * Email verification is now handled inline via Email OTP during authentication (`EmailOtpStep`).
 * Kept for backward-compatibility with direct URL links.
 */

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Center, PinInput } from "@mantine/core";
import { CheckCircleIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { authClient } from "@/lib/auth-client";
import { translateAuthError } from "@/lib/auth-errors";
import AuthShell, { AuthLoading } from "@/components/layout/AuthShell";
import { AuthButton } from "../_components/AuthButton";
import s from "../_components/auth.module.css";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;
const REDIRECT_DELAY_MS = 1500;
const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

function safeReturnUrl(raw: string | null): string {
  return raw && raw.startsWith("/") && !raw.startsWith("//") && !raw.startsWith("/\\") ? raw : "/dashboard";
}

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = (searchParams.get("email") ?? "").trim();
  const returnUrl = safeReturnUrl(searchParams.get("returnUrl"));
  const loginHref = `/auth?tab=login&returnUrl=${encodeURIComponent(returnUrl)}`;

  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const emailValid = useMemo(() => EMAIL_REGEX.test(email), [email]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(() => setResendCooldown((v) => (v <= 1 ? 0 : v - 1)), 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);

  const handleResend = useCallback(async () => {
    setError(null);
    setIsResending(true);
    try {
      const { error: resendError } = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "email-verification",
      });
      if (resendError) {
        if (resendError.status === 409) {
          router.push(loginHref);
          return;
        }
        if (resendError.status === 429) {
          setResendCooldown(RESEND_COOLDOWN_SECONDS);
          setError("Bạn đã gửi quá nhiều yêu cầu. Vui lòng chờ và thử lại.");
        } else {
          setError(translateAuthError(resendError.message));
        }
        return;
      }
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setOtp("");
    } catch {
      setError("Đã xảy ra lỗi khi gửi lại mã. Vui lòng thử lại sau.");
    } finally {
      setIsResending(false);
    }
  }, [email, loginHref, router]);

  const handleVerify = useCallback(async () => {
    setError(null);
    if (otp.length !== OTP_LENGTH) {
      setError("Vui lòng nhập đủ 6 chữ số.");
      return;
    }
    setIsVerifying(true);
    try {
      const { error: verifyError } = await authClient.emailOtp.verifyEmail({ email, otp });
      if (verifyError) {
        setError(translateAuthError(verifyError.message));
        return;
      }
      setSuccess(true);
      window.setTimeout(() => router.push(loginHref), REDIRECT_DELAY_MS);
    } catch {
      setError("Đã xảy ra lỗi khi xác minh. Vui lòng thử lại sau.");
    } finally {
      setIsVerifying(false);
    }
  }, [email, loginHref, otp, router]);

  if (!emailValid) {
    return (
      <div className={s.stack}>
        <div className={s.head}>
          <h1 className={s.title}>Xác minh email</h1>
        </div>
        <div className={s.error} role="alert">
          <WarningCircleIcon size={20} aria-hidden="true" />
          <span>Liên kết xác minh không hợp lệ. Vui lòng quay lại trang đăng ký.</span>
        </div>
        <AuthButton onClick={() => router.push("/auth")}>Quay lại đăng ký</AuthButton>
      </div>
    );
  }

  if (success) {
    return (
      <div className={s.stack}>
        <div className={s.head}>
          <h1 className={s.title}>Email đã được xác minh</h1>
          <p className={s.sub}>Đang chuyển đến trang đăng nhập...</p>
        </div>
        <AuthButton icon={<CheckCircleIcon size={18} aria-hidden="true" />} onClick={() => router.push(loginHref)}>
          Đi tới đăng nhập
        </AuthButton>
      </div>
    );
  }

  return (
    <div className={s.stack}>
      <div className={s.head}>
        <h1 className={s.title}>Kiểm tra email của bạn</h1>
        <p className={s.sub}>
          Chúng tôi đã gửi mã 6 chữ số đến <b>{email}</b>.
        </p>
      </div>

      {error && (
        <div className={s.error} role="alert">
          <WarningCircleIcon size={20} aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <Center>
        <PinInput
          length={OTP_LENGTH}
          type="number"
          gap={6}
          size="md"
          oneTimeCode
          autoFocus
          value={otp}
          onChange={setOtp}
          disabled={isVerifying}
          ariaLabel="Mã xác minh"
          classNames={{ pinInput: s.pinCell, input: s.pin }}
        />
      </Center>

      <div className={s.resendRow}>
        {resendCooldown > 0 ? (
          <span>Gửi lại ({resendCooldown}s)</span>
        ) : (
          <button
            type="button"
            className={`${s.link} ${s.linkAccent}`}
            disabled={isResending || isVerifying}
            onClick={handleResend}
          >
            {isResending ? "Đang gửi..." : "Gửi lại mã"}
          </button>
        )}
      </div>

      <AuthButton loading={isVerifying} disabled={otp.length !== OTP_LENGTH} onClick={handleVerify}>
        Xác minh email
      </AuthButton>

      <button type="button" className={s.link} disabled={isVerifying} onClick={() => router.push("/auth")}>
        Quay lại đăng ký
      </button>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <AuthShell>
      <Suspense fallback={<AuthLoading label="Đang tải..." />}>
        <VerifyEmailForm />
      </Suspense>
    </AuthShell>
  );
}
