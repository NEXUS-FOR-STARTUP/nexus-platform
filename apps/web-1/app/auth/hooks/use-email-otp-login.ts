"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient, signIn } from "@/lib/auth-client";
import { translateAuthError } from "@/lib/auth-errors";

export const OTP_LENGTH = 6;
export const OTP_RESEND_SECONDS = 60;

function axiosStatus(err: unknown): number | undefined {
  if (!err || typeof err !== "object" || !("response" in err)) return undefined;
  const response = err.response;
  if (!response || typeof response !== "object" || !("status" in response)) {
    return undefined;
  }
  return typeof response.status === "number" ? response.status : undefined;
}

export function useEmailOtpLogin(returnUrl: string) {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setInterval(() => {
      setCooldown((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [cooldown]);

  const clearError = useCallback(() => setError(null), []);

  const send = useCallback(async (email: string): Promise<boolean> => {
    setError(null);
    setSending(true);
    try {
      const { error: sendError } = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "sign-in",
      });

      if (sendError) {
        const status = sendError.status;
        if (status === 429) {
          setCooldown(OTP_RESEND_SECONDS);
          setError("Bạn đã gửi quá nhiều yêu cầu. Vui lòng chờ 1 phút rồi thử lại.");
          return false;
        }
        setError(translateAuthError(sendError.message));
        return false;
      }

      setCooldown(OTP_RESEND_SECONDS);
      return true;
    } catch (err: unknown) {
      const status = axiosStatus(err);
      if (status === 429) {
        setCooldown(OTP_RESEND_SECONDS);
        setError("Bạn đã gửi quá nhiều yêu cầu. Vui lòng chờ 1 phút rồi thử lại.");
        return false;
      }
      setError(translateAuthError());
      return false;
    } finally {
      setSending(false);
    }
  }, []);

  const verify = useCallback(
    async (email: string, otp: string): Promise<boolean> => {
      setError(null);
      if (otp.length !== OTP_LENGTH) {
        setError("Vui lòng nhập đủ 6 chữ số.");
        return false;
      }
      setVerifying(true);
      try {
        const { error: verifyError } = await signIn.emailOtp({
          email,
          otp,
          name: (email.split("@")[0]?.trim() || "User").slice(0, 32),
        });

        if (verifyError) {
          setError(translateAuthError(verifyError.message));
          return false;
        }

        router.push(returnUrl);
        return true;
      } catch {
        setError(translateAuthError());
        return false;
      } finally {
        setVerifying(false);
      }
    },
    [returnUrl, router],
  );

  return { sending, verifying, error, cooldown, send, verify, clearError };
}
