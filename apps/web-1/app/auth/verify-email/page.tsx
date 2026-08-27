"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { Anchor, Box, Button, Center, Group, Loader, PinInput, Text, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { authClient } from "@/lib/auth-client";
import { translateAuthError } from "@/lib/auth-errors";
import AuthShell from "@/components/layout/AuthShell";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;
const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = (searchParams.get("email") ?? "").trim();
  const returnUrl = searchParams.get("returnUrl") ?? "/dashboard";

  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const emailValid = useMemo(() => EMAIL_REGEX.test(email), [email]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(() => setResendCooldown((s) => (s <= 1 ? 0 : s - 1)), 1000);
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
          notifications.show({
            title: "Email đã được xác minh",
            message: "Tài khoản này đã được kích hoạt. Vui lòng đăng nhập.",
            color: "blue",
          });
          router.push(`/auth?tab=login&returnUrl=${encodeURIComponent(returnUrl)}`);
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
      setOtp("");
      notifications.show({
        title: "Đã gửi lại mã",
        message: `Mã xác minh mới đã được gửi tới ${email}`,
        color: "blue",
      });
    } catch {
      setError("Đã xảy ra lỗi khi gửi lại mã. Vui lòng thử lại sau.");
    } finally {
      setIsResending(false);
    }
  }, [email, returnUrl, router]);

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
      window.setTimeout(() => {
        router.push(`/auth?tab=login&returnUrl=${encodeURIComponent(returnUrl)}`);
      }, 1500);
    } catch {
      setError("Đã xảy ra lỗi khi xác minh. Vui lòng thử lại sau.");
    } finally {
      setIsVerifying(false);
    }
  }, [email, otp, returnUrl, router]);

  if (!emailValid) {
    return (
      <div className="space-y-4 font-body text-xs text-text-app">
        <Title ta="center" order={2} className="font-heading font-bold text-text-app text-lg">
          Xác minh email
        </Title>
        <div className="flex items-start gap-2 p-3 bg-danger-soft border border-danger/20 text-danger rounded-lg text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Liên kết xác minh không hợp lệ. Vui lòng quay lại trang đăng ký.</span>
        </div>
        <Group justify="center" mt="lg">
          <Button component={Link} href="/auth" color="brand" radius="md" className="font-semibold cursor-pointer">
            Quay lại đăng ký
          </Button>
        </Group>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-body text-xs text-text-app">
      <Title ta="center" order={2} className="font-heading font-bold text-text-app text-lg">
        Kiểm tra email của bạn
      </Title>
      <Text c="dimmed" fz="sm" ta="center" mt={5}>
        Chúng tôi đã gửi mã xác minh 6 chữ số đến <span className="font-semibold text-text-app">{email}</span>
      </Text>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-danger-soft border border-danger/20 text-danger rounded-lg text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-2 p-3 bg-success-soft border border-success/20 text-success rounded-lg text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Email của bạn đã được xác minh thành công. Đang chuyển đến trang đăng nhập...</span>
        </div>
      )}

      {!success && (
        <>
          <Center my="sm">
            <PinInput
              length={OTP_LENGTH}
              value={otp}
              onChange={setOtp}
              type="number"
              size="lg"
              radius="md"
              oneTimeCode
              autoFocus
              disabled={isVerifying}
              ariaLabel="Mã xác minh"
            />
          </Center>

          {/* Resend prompt nhạt / subtle */}
          <div className="flex items-center justify-center gap-1.5 text-xs text-text-muted">
            <span>Không nhận được mã?</span>
            <Button
              variant="subtle"
              color="brand"
              size="compact-xs"
              className="font-semibold cursor-pointer text-xs"
              onClick={handleResend}
              disabled={isResending || resendCooldown > 0}
              leftSection={isResending ? <Loader2 className="w-3 h-3 animate-spin" /> : undefined}
            >
              {resendCooldown > 0 ? `Gửi lại sau ${resendCooldown}s` : "Gửi lại mã"}
            </Button>
          </div>

          <Group justify="space-between" mt="lg">
            <Anchor component={Link} href="/auth" c="dimmed" size="sm" className="font-semibold">
              <Center inline>
                <ArrowLeft size={14} className="mr-1.5" />
                <Box>Quay lại đăng ký</Box>
              </Center>
            </Anchor>
            <Button
              color="brand"
              radius="md"
              className="font-semibold cursor-pointer"
              onClick={handleVerify}
              disabled={isVerifying || otp.length !== OTP_LENGTH}
              leftSection={isVerifying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : undefined}
            >
              Xác minh email
            </Button>
          </Group>
        </>
      )}

      {success && (
        <Group justify="center" mt="lg">
          <Button
            component={Link}
            href={`/auth?tab=login&returnUrl=${encodeURIComponent(returnUrl)}`}
            color="brand"
            radius="md"
            className="font-semibold cursor-pointer"
          >
            Đi tới đăng nhập
          </Button>
        </Group>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <AuthShell>
      <Suspense fallback={<div className="py-12 flex flex-col items-center justify-center min-h-[300px] gap-4"><Loader color="blue" size="lg" type="dots" /></div>}>
        <VerifyEmailForm />
      </Suspense>
    </AuthShell>
  );
}
