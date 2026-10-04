"use client";

import { useCallback, useState } from "react";
import { notifications } from "@mantine/notifications";
import { signIn } from "@/lib/auth-client";
import { translateAuthError } from "@/lib/auth-errors";

export function useGoogleSignIn(returnUrl: string) {
  const [loading, setLoading] = useState(false);

  const signInGoogle = useCallback(async () => {
    setLoading(true);
    try {
      const res = await signIn.social({
        provider: "google",
        callbackURL: `${window.location.origin}${returnUrl}`,
      });
      if (res?.error) {
        setLoading(false);
        notifications.show({
          title: "Lỗi đăng nhập",
          message:
            translateAuthError(res.error.message) ||
            "Không thể khởi tạo đăng nhập bằng Google. Vui lòng thử lại sau.",
          color: "red",
        });
      }
    } catch {
      setLoading(false);
      notifications.show({
        title: "Lỗi đăng nhập",
        message: "Không thể khởi tạo đăng nhập bằng Google. Vui lòng thử lại sau.",
        color: "red",
      });
    }
  }, [returnUrl]);

  return { loading, signInGoogle };
}
