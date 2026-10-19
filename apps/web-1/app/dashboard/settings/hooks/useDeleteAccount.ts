"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { signOut } from "@/lib/auth-client";
import { apiClient } from "@/lib/api-client";
import { notifications } from "@mantine/notifications";
import { extractApiErrorMessage } from "./extract-api-error";

export function useDeleteAccount() {
  const router = useRouter();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.delete<{ success: boolean; message: string }>(
        "/profile/account",
      );
      return response.data;
    },
    onSuccess: async () => {
      notifications.show({
        title: "Thành công",
        message: "Tài khoản của bạn đã được xóa vĩnh viễn.",
        color: "green",
      });
      try {
        await signOut();
      } catch {
        // ignore sign out error
      }
      queryClient.clear();
      router.replace("/auth");
    },
    onError: (err: unknown) => {
      notifications.show({
        title: "Lỗi",
        message: extractApiErrorMessage(err) || "Không thể xóa tài khoản. Vui lòng thử lại sau.",
        color: "red",
      });
    },
  });
}
