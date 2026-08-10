"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, AlertCircle, CheckCircle } from "lucide-react";
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
import { authClient } from "@/lib/auth-client";
import AuthShell from "@/components/layout/AuthShell";

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm({
    defaultValues: {
      email: "",
    },
    onSubmit: async ({ value }) => {
      setIsLoading(true);
      setError(null);
      setSuccess(false);

      try {
        const res = await authClient.requestPasswordReset({
          email: value.email,
          redirectTo: "/auth/reset-password",
        });

        if (res.error) {
          setError(res.error.message || "Đã xảy ra lỗi khi gửi yêu cầu khôi phục mật khẩu.");
        } else {
          setSuccess(true);
        }
      } catch (err: any) {
        setError(err.message || "Đã xảy ra lỗi khi gửi yêu cầu khôi phục mật khẩu.");
      } finally {
        setIsLoading(false);
      }
    },
  });

  return (
    <AuthShell>
      <div className="space-y-4 font-body text-base text-text-app">
        <Title ta="center" order={2} className="font-heading font-bold text-text-app text-h2">
          Quên mật khẩu?
        </Title>
        <Text c="dimmed" fz="sm" ta="center" mt={5}>
          Nhập email của bạn để nhận liên kết đặt lại mật khẩu
        </Text>

        {error && (
          <div className="flex items-start gap-2 p-3 bg-danger-soft border border-danger/20 text-danger rounded-lg text-sm">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-2 p-3 bg-success-soft border border-success/20 text-success rounded-lg text-sm">
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Liên kết khôi phục mật khẩu đã được gửi đến email của bạn.</span>
          </div>
        )}

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
              Gửi liên kết
            </Button>
          </Group>
        </form>
      </div>
    </AuthShell>
  );
}
