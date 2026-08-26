"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { useForm } from "@tanstack/react-form";
import { Anchor, Box, Button, Center, Group, Text, Title } from "@mantine/core";
import { authClient } from "@/lib/auth-client";
import { translateAuthError } from "@/lib/auth-errors";
import {
  ConfirmPasswordField,
  NewPasswordField,
  firstFieldError,
  passwordValidator,
} from "./ResetPasswordFields";

const RESET_EMAIL_KEY = "nexus.password-reset.email";

type NewPasswordStepProps = {
  email: string;
  otp: string;
  onBackToOtp: () => void;
};

export default function NewPasswordStep({ email, otp, onBackToOtp }: NewPasswordStepProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    onSubmit: async ({ value }) => {
      setIsLoading(true);
      setError(null);

      try {
        const { error: resetError } = await authClient.emailOtp.resetPassword({
          email: email.trim().toLowerCase(),
          otp,
          password: value.password,
        });

        if (resetError) {
          setError(
            resetError.status === 429
              ? "Bạn đã gửi quá nhiều yêu cầu. Vui lòng chờ 60s và thử lại."
              : translateAuthError(resetError.message) ||
              "Đã xảy ra lỗi khi đặt lại mật khẩu.",
          );
          return;
        }

        sessionStorage.removeItem(RESET_EMAIL_KEY);
        setSuccess(true);
        window.setTimeout(() => {
          router.push("/auth?tab=login");
        }, 1500);
      } catch {
        setError("Đã xảy ra lỗi khi đặt lại mật khẩu.");
      } finally {
        setIsLoading(false);
      }
    },
  });

  return (
    <div className="space-y-4 font-body text-xs text-text-app">
      <Title ta="center" order={2} className="font-heading font-bold text-text-app text-lg">
        Tạo mật khẩu mới
      </Title>
      <Text c="dimmed" fz="sm" ta="center" mt={5}>
        Mã OTP đã được xác minh thành công. Nhập mật khẩu mới cho tài khoản <span className="font-semibold text-text-app">{email}</span>
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
          <span>Mật khẩu đã được đặt lại thành công. Đang chuyển đến trang đăng nhập...</span>
        </div>
      )}

      {!success && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          <form.Field
            name="password"
            validators={{ onChange: passwordValidator }}
            children={(field) => (
              <NewPasswordField
                name={field.name}
                value={field.state.value}
                error={firstFieldError(field.state.meta.errors)}
                disabled={isLoading}
                onBlur={field.handleBlur}
                onChange={field.handleChange}
              />
            )}
          />
          <form.Field
            name="confirmPassword"
            validators={{
              onChangeListenTo: ["password"],
              onChange: ({ value }) =>
                value !== form.getFieldValue("password")
                  ? "Xác nhận mật khẩu không khớp."
                  : undefined,
            }}
            children={(field) => (
              <ConfirmPasswordField
                name={field.name}
                value={field.state.value}
                error={firstFieldError(field.state.meta.errors)}
                disabled={isLoading}
                onBlur={field.handleBlur}
                onChange={field.handleChange}
              />
            )}
          />
          <Group justify="space-between" mt="lg">
            <Anchor component="button" type="button" onClick={onBackToOtp} c="dimmed" size="sm" className="font-semibold cursor-pointer">
              <Center inline>
                <ArrowLeft size={14} className="mr-1.5" />
                <Box>Nhập lại mã OTP</Box>
              </Center>
            </Anchor>
            <Button
              type="submit"
              disabled={isLoading}
              color="brand"
              radius="md"
              className="font-semibold cursor-pointer"
              leftSection={isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : undefined}
            >
              Cập nhật mật khẩu
            </Button>
          </Group>
        </form>
      )}

      {success && (
        <Group justify="center" mt="lg">
          <Button component={Link} href="/auth?tab=login" color="brand" radius="md" className="font-semibold cursor-pointer">
            Đi tới đăng nhập
          </Button>
        </Group>
      )}
    </div>
  );
}
