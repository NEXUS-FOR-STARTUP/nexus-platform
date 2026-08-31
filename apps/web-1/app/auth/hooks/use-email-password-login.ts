"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { signIn } from "@/lib/auth-client";
import { translateAuthError } from "@/lib/auth-errors";

function axiosErrorMessage(err: unknown): string | undefined {
  if (!err || typeof err !== "object" || !("response" in err)) return undefined;
  const response = err.response;
  if (!response || typeof response !== "object" || !("data" in response)) {
    return undefined;
  }
  const data = response.data;
  if (!data || typeof data !== "object" || !("message" in data)) return undefined;
  return typeof data.message === "string" ? data.message : undefined;
}

export function useEmailPasswordLogin(returnUrl: string) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);
  const loginWithPassword = useCallback(
    async (
      email: string,
      password: string,
    ): Promise<"signed-in" | "not-exists" | "no-password" | "error"> => {
      setError(null);
      setLoading(true);
      try {
        const res = await apiClient.post<{
          exists: boolean;
          hasPassword: boolean;
        }>("/profile/password-status", { email });
        if (!res.data.exists) {
          return "not-exists";
        }
        if (!res.data.hasPassword) {
          setError(
            "Tài khoản chưa có mật khẩu. Quay lại và chọn Đăng nhập OTP.",
          );
          return "no-password";
        }

        const { error: signInError } = await signIn.email({
          email,
          password,
        });

        if (signInError) {
          setError(translateAuthError(signInError.message));
          return "error";
        }

        router.push(returnUrl);
        return "signed-in";
      } catch (err: unknown) {
        setError(translateAuthError(axiosErrorMessage(err)));
        return "error";
      } finally {
        setLoading(false);
      }
    },
    [returnUrl, router],
  );

  return {
    loading,
    error,
    clearError,
    loginWithPassword,
  };
}
