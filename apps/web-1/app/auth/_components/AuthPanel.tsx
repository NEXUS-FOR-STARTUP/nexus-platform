"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import { signIn, signUp } from "@/lib/auth-client";
import {
  TextInput,
  PasswordInput,
  Paper,
  Text,
  Group,
  Divider,
  Button,
  Checkbox,
  Anchor,
  Stack,
} from "@mantine/core";
import { Lock, Mail, User, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { notifications } from "@mantine/notifications";

// Custom Google Button with Google SVG Icon
export function GoogleButton(props: any) {
  return (
    <Button
      leftSection={
        <svg viewBox="0 0 48 48" width="16" height="16">
          <path
            fill="#EA4335"
            d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
          />
          <path
            fill="#4285F4"
            d="M46.5 24c0-1.61-.15-3.16-.42-4.69H24v8.89h12.66c-.55 2.92-2.2 5.39-4.69 7.06l7.29 5.65C43.62 36.2 46.5 30.65 46.5 24z"
          />
          <path
            fill="#FBBC05"
            d="M10.54 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.98-6.19z"
          />
          <path
            fill="#34A853"
            d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.29-5.65c-2.03 1.37-4.63 2.19-8.6 2.19-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
          />
        </svg>
      }
      variant="default"
      radius="xl"
      className="cursor-pointer font-semibold"
      {...props}
    />
  );
}

// Cấu hình bật/tắt tính năng đăng nhập Google bằng hằng số
const ENABLE_GOOGLE_LOGIN = true; // Thay đổi thành true để kích hoạt đăng nhập Google

export default function AuthPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickLogin, setShowQuickLogin] = useState(false);

  // Compute redirect URL: returnUrl > package-specific > /dashboard
  const getRedirectUrl = () => {
    const returnUrl = searchParams.get("returnUrl");
    if (returnUrl) return returnUrl;

    const packageId = searchParams.get("packageId");
    if (packageId === "pkg_tf_free") return "/dashboard/team-fit";
    if (packageId === "pkg_tf_audit") return `/dashboard/intake?packageId=${packageId}`;
    return "/dashboard";
  };

  // Điều hướng tới màn nhập OTP xác minh email (email + returnUrl nội bộ, không kèm password).
  const redirectToVerifyEmail = (email: string, returnUrl: string) => {
    router.push(
      `/auth/verify-email?email=${encodeURIComponent(email)}&returnUrl=${encodeURIComponent(returnUrl)}`,
    );
  };

  const handleQuickLogin = async (email: string) => {
    setAuthError(null);
    setIsLoading(true);
    const callbackUrl = getRedirectUrl();

    try {
      await signIn.email(
        {
          email,
          password: "Password123",
        },
        {
          onSuccess: () => {
            setIsLoading(false);
            router.push(callbackUrl);
          },
          onError: (ctx) => {
            setIsLoading(false);
            if (ctx.error.status === 403) {
              redirectToVerifyEmail(email, callbackUrl);
              return;
            }
            setAuthError(
              ctx.error.message || "Đăng nhập nhanh không thành công.",
            );
          },
        },
      );
    } catch (err) {
      setIsLoading(false);
      setAuthError("Đã xảy ra lỗi hệ thống khi đăng nhập nhanh.");
    }
  };

  const handleGoogleSignIn = async () => {
    if (!ENABLE_GOOGLE_LOGIN) {
      notifications.show({
        title: "Tính năng đang phát triển",
        message:
          "Đăng nhập bằng Google hiện đang được phát triển và sẽ sớm ra mắt.",
        color: "blue",
      });
      return;
    }

    setIsLoading(true);
    setAuthError(null);

    const callbackUrl = `${window.location.origin}${getRedirectUrl()}`;

    try {
      await signIn.social({
        provider: "google",
        callbackURL: callbackUrl,
      });
    } catch (err) {
      setIsLoading(false);
      notifications.show({
        title: "Lỗi đăng nhập",
        message:
          "Không thể khởi tạo đăng nhập bằng Google. Vui lòng thử lại sau.",
        color: "red",
      });
    }
  };

  // Read initial tab and package ID from URL search parameters
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "register") {
      setActiveTab("register");
    } else {
      setActiveTab("login");
    }
  }, [searchParams]);

  // Form handling using TanStack Form
  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      terms: true,
    },
    onSubmit: async ({ value }) => {
      setAuthError(null);
      setIsLoading(true);

      const callbackUrl = getRedirectUrl();

      try {
        if (activeTab === "login") {
          await signIn.email(
            {
              email: value.email,
              password: value.password,
            },
            {
              onSuccess: () => {
                setIsLoading(false);
                router.push(callbackUrl);
              },
              onError: (ctx) => {
                setIsLoading(false);
                if (ctx.error.status === 403) {
                  redirectToVerifyEmail(value.email, callbackUrl);
                  return;
                }
                setAuthError(
                  ctx.error.message ||
                    "Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.",
                );
              },
            },
          );
        } else {
          if (value.password !== value.confirmPassword) {
            setAuthError("Mật khẩu xác nhận không khớp.");
            setIsLoading(false);
            return;
          }

          if (!value.terms) {
            setAuthError("Bạn phải đồng ý với các điều khoản dịch vụ.");
            setIsLoading(false);
            return;
          }

          await signUp.email(
            {
              email: value.email,
              password: value.password,
              name: value.name,
            },
            {
              onSuccess: () => {
                setIsLoading(false);
                redirectToVerifyEmail(value.email, callbackUrl);
              },
              onError: (ctx) => {
                setIsLoading(false);
                if (ctx.error.status === 409) {
                  notifications.show({
                    title: "Email đã được xác minh",
                    message: "Tài khoản này đã được đăng ký. Vui lòng đăng nhập.",
                    color: "blue",
                  });
                  router.push(
                    `/auth?tab=login&returnUrl=${encodeURIComponent(callbackUrl)}`,
                  );
                  return;
                }
                setAuthError(
                  ctx.error.message ||
                    "Đăng ký không thành công. Email có thể đã tồn tại.",
                );
              },
            },
          );
        }
      } catch (err) {
        setIsLoading(false);
        setAuthError("Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.");
      }
    },
  });

  return (
    <div className="w-full font-body text-xs text-text-app space-y-6">
      {/* Social Provider: Google Only */}
      <Group grow mb="md">
        <GoogleButton onClick={handleGoogleSignIn}>Google</GoogleButton>
      </Group>

      <Divider
        label="Hoặc tiếp tục bằng email"
        labelPosition="center"
        my="lg"
        className="border-border-app"
      />

      {/* Global Auth Error Alert */}
      {authError && (
        <div className="flex items-start gap-2 p-3 mb-4 bg-danger-soft border border-danger/20 text-danger rounded-lg text-xs font-body">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{authError}</span>
        </div>
      )}

      {/* Form Submission */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-4"
      >
        <Stack gap="md">
          {activeTab === "register" && (
            <form.Field
              name="name"
              validators={{
                onChange: ({ value }) =>
                  !value ? "Họ và tên là bắt buộc" : undefined,
              }}
              children={(field) => (
                <TextInput
                  id="name"
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  label="Họ và tên"
                  placeholder="Nguyễn Văn A"
                  leftSection={<User className="w-4 h-4 text-text-subtle" />}
                  error={
                    field.state.meta.errors.length > 0
                      ? field.state.meta.errors[0]
                      : undefined
                  }
                  required
                  variant="default"
                  radius="md"
                  disabled={isLoading}
                />
              )}
            />
          )}

          <form.Field
            name="email"
            validators={{
              onChange: ({ value }) => {
                if (!value) return "Email là bắt buộc";
                if (!/\S+@\S+\.\S+/.test(value))
                  return "Email không đúng định dạng";
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
                leftSection={<Mail className="w-4 h-4 text-text-subtle" />}
                error={
                  field.state.meta.errors.length > 0
                    ? field.state.meta.errors[0]
                    : undefined
                }
                required
                variant="default"
                radius="md"
                disabled={isLoading}
              />
            )}
          />

          <form.Field
            name="password"
            validators={{
              onChange: ({ value }) => {
                if (!value) return "Mật khẩu là bắt buộc";
                if (value.length < 6)
                  return "Mật khẩu phải chứa ít nhất 6 ký tự";
                return undefined;
              },
            }}
            children={(field) => (
              <PasswordInput
                id="password"
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                label="Mật khẩu"
                placeholder="••••••••"
                leftSection={<Lock className="w-4 h-4 text-text-subtle" />}
                error={
                  field.state.meta.errors.length > 0
                    ? field.state.meta.errors[0]
                    : undefined
                }
                required
                variant="default"
                radius="md"
                disabled={isLoading}
              />
            )}
          />

          {activeTab === "register" && (
            <form.Field
              name="confirmPassword"
              validators={{
                onChange: ({ value }) =>
                  !value ? "Xác nhận mật khẩu là bắt buộc" : undefined,
              }}
              children={(field) => (
                <PasswordInput
                  id="confirmPassword"
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  label="Xác nhận mật khẩu"
                  placeholder="••••••••"
                  leftSection={<Lock className="w-4 h-4 text-text-subtle" />}
                  error={
                    field.state.meta.errors.length > 0
                      ? field.state.meta.errors[0]
                      : undefined
                  }
                  required
                  variant="default"
                  radius="md"
                  disabled={isLoading}
                />
              )}
            />
          )}

          {/* Terms / Forgot Password row */}
          <Group justify="space-between" mt="xs">
            {activeTab === "register" ? (
              <form.Field
                name="terms"
                children={(field) => (
                  <Checkbox
                    label="Tôi đồng ý với điều khoản dịch vụ"
                    checked={field.state.value}
                    onChange={(e) => field.handleChange(e.target.checked)}
                    radius="sm"
                    disabled={isLoading}
                  />
                )}
              />
            ) : (
              <div />
            )}

            {activeTab === "login" && (
              <Anchor
                component={Link}
                href="/auth/forgot-password"
                size="xs"
                c="dimmed"
                className="font-semibold"
              >
                Quên mật khẩu?
              </Anchor>
            )}
          </Group>
        </Stack>

        {/* Submit Button */}
        <Button
          type="submit"
          loading={isLoading}
          fullWidth
          mt="xl"
          radius="xl"
          color="brand"
          className="cursor-pointer font-semibold"
        >
          {activeTab === "login" ? "Đăng nhập" : "Đăng ký thành viên"}
        </Button>
      </form>

      {/* Switch between Login and Register */}
      <Group justify="center" mt="md">
        <Anchor
          component="button"
          type="button"
          c="dimmed"
          onClick={() => {
            setActiveTab(activeTab === "login" ? "register" : "login");
            setAuthError(null);
            form.reset();
          }}
          size="xs"
          className="font-semibold"
        >
          {activeTab === "register"
            ? "Đã có tài khoản? Đăng nhập"
            : "Chưa có tài khoản? Đăng ký"}
        </Anchor>
      </Group>

      {/* Quick Login Collapsible — tạm ẩn */}
      {/* <div className="pt-4 mt-6 border-t border-border-app">
        <button
          type="button"
          onClick={() => setShowQuickLogin(!showQuickLogin)}
          className="w-full flex items-center justify-between py-2 text-xs font-semibold font-body text-text-muted hover:text-brand transition-colors cursor-pointer"
        >
          <span>Đăng nhập nhanh (Tài khoản Test)</span>
          <span className="text-base leading-none">
            {showQuickLogin ? "−" : "+"}
          </span>
        </button>

        {showQuickLogin && (
          <div className="mt-3 grid grid-cols-3 gap-2 animate-fade-in">
            <button
              type="button"
              onClick={() => handleQuickLogin("student@example.com")}
              className="flex flex-col items-center justify-center p-2.5 rounded-lg border border-border-app bg-surface-soft hover:bg-brand-soft/20 hover:border-brand/30 transition-all cursor-pointer text-center group font-body"
              disabled={isLoading}
            >
              <span className="font-heading font-semibold text-xs text-text-app group-hover:text-brand transition-colors">
                Student
              </span>
              <span className="text-base text-text-subtle mt-0.5 break-all">
                student@example.com
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin("supporter@example.com")}
              className="flex flex-col items-center justify-center p-2.5 rounded-lg border border-border-app bg-surface-soft hover:bg-brand-soft/20 hover:border-brand/30 transition-all cursor-pointer text-center group font-body"
              disabled={isLoading}
            >
              <span className="font-heading font-semibold text-xs text-text-app group-hover:text-brand transition-colors">
                Supporter
              </span>
              <span className="text-base text-text-subtle mt-0.5 break-all">
                supporter@example.com
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin("admin@example.com")}
              className="flex flex-col items-center justify-center p-2.5 rounded-lg border border-border-app bg-surface-soft hover:bg-brand-soft/20 hover:border-brand/30 transition-all cursor-pointer text-center group font-body"
              disabled={isLoading}
            >
              <span className="font-heading font-semibold text-xs text-text-app group-hover:text-brand transition-colors">
                Admin
              </span>
              <span className="text-base text-text-subtle mt-0.5 break-all">
                admin@example.com
              </span>
            </button>
          </div>
        )}
      </div> */}
    </div>
  );
}
