"use client";

import { useMutation } from "@tanstack/react-query";
import { updateUser } from "@/lib/auth-client";
import { notifications } from "@mantine/notifications";
import { translateAuthError } from "@/lib/auth-errors";

// QUAN TRỌNG: Better Auth updateUser KHÔNG throw khi lỗi —
// trả { data, error }. mutationFn phải tự check và throw, nếu không onError
// không bao giờ chạy và onSuccess chạy cả khi lỗi (toast xanh sai).
export function useUpdateProfileName() {
  return useMutation({
    mutationFn: async (name: string) => {
      const result = await updateUser({ name });
      if (result.error) throw new Error(result.error.message || "update failed");
      return result.data;
    },
    onSuccess: () =>
      notifications.show({
        title: "Thành công",
        message: "Đã cập nhật thông tin hồ sơ.",
        color: "green",
      }),
    onError: (err: unknown) =>
      notifications.show({
        title: "Lỗi",
        message:
          translateAuthError(err instanceof Error ? err.message : "") ||
          "Không thể cập nhật tên hiển thị.",
        color: "red",
      }),
  });
}
