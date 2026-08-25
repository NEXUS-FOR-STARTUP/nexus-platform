"use client";

import React, { useCallback, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Anchor, Box, Button, Center, Group, PinInput, Text, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { authClient } from "@/lib/auth-client";
import { translateAuthError } from "@/lib/auth-errors";

const OTP_LENGTH = 6;

function showErrorNotification(message: string) {
  notifications.show({
    title: "Thao tác không thành công",
    message,
    color: "red",
  });
}

type OtpStepSectionProps = {
  email: string;
  onVerified: (otp: string) => void;
};

export default function OtpStepSection({
  email,
  onVerified,
}: OtpStepSectionProps) {
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleResend = useCallback(async () => {
    if (!email) {
      showErrorNotification("Không tìm thấy email nhận mã OTP.");
      return;
    }

    setIsResending(true);
    try {
      const { error: resendError } = await authClient.emailOtp.requestPasswordReset({
        email: email.trim().toLowerCase(),
      });

      if (resendError) {
        if (resendError.status === 429) {
          showErrorNotification("Bạn thao tác quá nhanh hoặc gửi quá nhiều yêu cầu. Vui lòng chờ 60s và thử lại.");
        } else {
          showErrorNotification(translateAuthError(resendError.message) || "Đã xảy ra lỗi khi gửi lại mã OTP.");
        }
        return;
      }

      setOtp("");
      notifications.show({
        title: "Đã gửi lại mã",
        message: `Mã OTP mới đã được gửi tới ${email}`,
        color: "blue",
      });
    } catch {
      showErrorNotification("Đã xảy ra lỗi khi gửi lại mã OTP. Vui lòng thử lại sau.");
    } finally {
      setIsResending(false);
    }
  }, [email]);

  const handleVerify = useCallback(async () => {
    if (!email) {
      showErrorNotification("Vui lòng nhập email nhận mã OTP.");
      return;
    }
    if (otp.length !== OTP_LENGTH) {
      showErrorNotification("Vui lòng nhập đủ 6 chữ số.");
      return;
    }

    setIsVerifying(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const { error: checkError } = await authClient.emailOtp.checkVerificationOtp({
        email: cleanEmail,
        otp,
        type: "forget-password",
      });

      if (checkError) {
        if (checkError.status === 429) {
          showErrorNotification("Bạn thao tác quá nhanh. Vui lòng chờ 60s và thử lại.");
        } else {
          showErrorNotification(translateAuthError(checkError.message) || "Mã xác minh không đúng.");
        }
        return;
      }

      onVerified(otp);
    } catch {
      showErrorNotification("Đã xảy ra lỗi khi xác minh mã OTP.");
    } finally {
      setIsVerifying(false);
    }
  }, [email, otp, onVerified]);

  return (
    <div className="space-y-4 font-body text-xs text-text-app">
      <Title ta="center" order={2} className="font-heading font-bold text-text-app text-lg">
        Xác minh mã OTP
      </Title>
      <Text c="dimmed" fz="sm" ta="center" mt={5}>
        Chúng tôi đã gửi mã OTP 6 chữ số đến <span className="font-semibold text-text-app">{email || "email của bạn"}</span>
      </Text>

      <Center my="md">
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
          ariaLabel="Mã OTP 6 chữ số"
        />
      </Center>

      <div className="flex items-center justify-center gap-1.5 text-xs text-text-muted">
        <span>Chưa nhận được mã?</span>
        <Button
          variant="subtle"
          color="brand"
          size="compact-xs"
          className="font-semibold cursor-pointer text-xs"
          onClick={handleResend}
          disabled={isResending}
          leftSection={isResending ? <Loader2 className="w-3 h-3 animate-spin" /> : undefined}
        >
          Gửi lại mã
        </Button>
      </div>

      <Group justify="space-between" mt="lg">
        <Anchor component={Link} href="/auth/forgot-password" c="dimmed" size="sm" className="font-semibold">
          <Center inline>
            <ArrowLeft size={14} className="mr-1.5" />
            <Box>Quay lại</Box>
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
          Xác minh mã
        </Button>
      </Group>
    </div>
  );
}
