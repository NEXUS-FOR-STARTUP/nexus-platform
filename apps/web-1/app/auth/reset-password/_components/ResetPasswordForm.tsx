"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Button, Center, Stack, Text, Title } from "@mantine/core";
import OtpStepSection from "./OtpStepSection";
import NewPasswordStep from "./NewPasswordStep";

const RESET_EMAIL_KEY = "nexus.password-reset.email";

export default function ResetPasswordForm() {
  const didPrefill = useRef(false);
  const [step, setStep] = useState<"otp" | "password">("otp");
  const [email, setEmail] = useState<string | null>(null);
  const [verifiedOtp, setVerifiedOtp] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (didPrefill.current) return;
    didPrefill.current = true;
    const stored = sessionStorage.getItem(RESET_EMAIL_KEY);
    if (stored && stored.trim()) {
      setEmail(stored.trim());
    } else {
      setEmail("");
    }
    setIsLoaded(true);
  }, []);

  const handleVerified = (otpCode: string) => {
    setVerifiedOtp(otpCode);
    setStep("password");
  };

  const handleBackToOtp = () => {
    setStep("otp");
  };

  if (!isLoaded) {
    return null;
  }

  if (!email) {
    return (
      <Stack align="center" gap="md" py="xl">
        <Center className="w-12 h-12 rounded-full bg-amber-50 text-amber-600">
          <AlertCircle size={24} />
        </Center>
        <Title order={3} ta="center" className="font-heading text-lg font-bold text-text-app">
          Chưa có yêu cầu đặt lại mật khẩu
        </Title>
        <Text c="dimmed" size="sm" ta="center" maw={320}>
          Vui lòng nhập email của bạn tại trang Quên mật khẩu để nhận mã xác minh OTP.
        </Text>
        <Button
          component={Link}
          href="/auth/forgot-password"
          color="brand"
          radius="md"
          mt="sm"
          leftSection={<ArrowLeft size={16} />}
        >
          Đến trang Quên mật khẩu
        </Button>
      </Stack>
    );
  }

  if (step === "otp") {
    return (
      <OtpStepSection
        email={email}
        onVerified={handleVerified}
      />
    );
  }

  return (
    <NewPasswordStep
      email={email}
      otp={verifiedOtp}
      onBackToOtp={handleBackToOtp}
    />
  );
}
