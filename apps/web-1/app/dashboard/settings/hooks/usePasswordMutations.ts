"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { notifications } from "@mantine/notifications";
import { translateAuthError } from "@/lib/auth-errors";
import { extractApiErrorMessage } from "./extract-api-error";

export function usePasswordMutations() {
  const queryClient = useQueryClient();
  const changePassword = useMutation({
    mutationFn: async (input: { currentPassword: string; newPassword: string }) => {
      const response = await apiClient.post<{ ok: true }>(
        "/profile/password/change",
        input,
      );
      return response.data;
    },
    onSuccess: () => {
      notifications.show({
        title: "Thành công",
        message: "Đã đổi mật khẩu thành công. Các thiết bị khác đã được đăng xuất.",
        color: "green",
      });
      void queryClient.invalidateQueries({ queryKey: ["password-status"] });
    },
    onError: (err: unknown) =>
      notifications.show({
        title: "Lỗi",
        message:
          extractApiErrorMessage(err) ||
          translateAuthError(err instanceof Error ? err.message : "") ||
          "Không thể đổi mật khẩu. Kiểm tra lại mật khẩu hiện tại.",
        color: "red",
      }),
  });

  const setPassword = useMutation({
    mutationFn: async (password: string) => {
      const response = await apiClient.post<{ ok: true }>("/profile/password", {
        password,
      });
      return response.data;
    },
    onSuccess: () => {
      notifications.show({
        title: "Thành công",
        message: "Đã đặt mật khẩu. Có thể đăng nhập bằng mật khẩu lần sau.",
        color: "green",
      });
      void queryClient.invalidateQueries({ queryKey: ["password-status"] });
    },
    onError: (err: unknown) =>
      notifications.show({
        title: "Lỗi",
        message:
          extractApiErrorMessage(err) ||
          "Không thể đặt mật khẩu. Vui lòng thử lại.",
        color: "red",
      }),
  });

  return { changePassword, setPassword };
}

export function useHasPasswordQuery() {
  return useQuery({
    queryKey: ["password-status"],
    queryFn: async () => {
      const res = await apiClient.get<{ hasPassword: boolean }>(
        "/profile/password-status",
      );
      return res.data.hasPassword;
    },
  });
}
