"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useForm } from "@tanstack/react-form";
import {
  Anchor,
  Box,
  Button,
  Center,
  Group,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { authClient } from "@/lib/auth-client";
import { translateAuthError } from "@/lib/auth-errors";
import AuthShell from "@/components/layout/AuthShell";

const RESET_EMAIL_KEY = "nexus.password-reset.email";

function showErrorNotification(message: string) {
  notifications.show({
    title: "Thao tác không thành công",
    message,
    color: "red",
  });
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    defaultValues: {
      email: "",
    },
    onSubmit: async ({ value }) => {
      setIsLoading(true);

      const email = value.email.trim().toLowerCase();

      try {
        const res = await authClient.emailOtp.requestPasswordReset({ email });

        if (res.error) {
          if (res.error.status === 429) {
            showErrorNotification("Bạn đã gửi quá nhiều yêu cầu. Vui lòng chờ 60s và thử lại.");
          } else {
            showErrorNotification(
              translateAuthError(res.error.message) ||
                "Đã xảy ra lỗi khi gửi mã đặt lại mật khẩu.",
            );
          }
          return;
        }

        sessionStorage.setItem(RESET_EMAIL_KEY, email);
        router.push("/auth/reset-password");
      } catch {
        showErrorNotification("Đã xảy ra lỗi khi gửi mã đặt lại mật khẩu.");
      } finally {
        setIsLoading(false);
      }
    },
  });

  return (
    <AuthShell>
      <div className="space-y-4 font-body text-xs text-text-app">
        <Title ta="center" order={2} className="font-heading font-bold text-text-app text-lg">
          Quên mật khẩu?
        </Title>
        <Text c="dimmed" fz="sm" ta="center" mt={5}>
          Nhập email của bạn để nhận mã OTP đặt lại mật khẩu
        </Text>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          <form.Field
            name="email"
            validators={{
              onChange: ({ value }) => {
                if (!value) return "Email là bắt buộc";
                if (!/\S+@\S+\.\S+/.test(value)) return "Email không đúng định dạng";
                return undefined;
              },
            }}
            children={(field) => (
              <TextInput
                id="email"
                type="email"
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                label="Địa chỉ Email"
                placeholder="name@example.com"
                error={field.state.meta.errors.length > 0 ? field.state.meta.errors[0] : undefined}
                required
                radius="md"
                disabled={isLoading}
              />
            )}
          />

          <Group justify="space-between" mt="lg">
            <Anchor component={Link} href="/auth" c="dimmed" size="sm" className="font-semibold">
              <Center inline>
                <ArrowLeft size={14} className="mr-1.5" />
                <Box>Quay lại đăng nhập</Box>
              </Center>
            </Anchor>
            <Button
              type="submit"
              disabled={isLoading}
              color="brand"
              radius="md"
              className="font-semibold cursor-pointer"
              leftSection={isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            >
              Gửi mã OTP
            </Button>
          </Group>
        </form>
      </div>
    </AuthShell>
  );
}
