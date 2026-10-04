"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { notifications } from "@mantine/notifications";

function extractErrorMessage(error: any, defaultMsg: string): string {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return defaultMsg;
}

export function useSessionMutations() {
  const queryClient = useQueryClient();

  const revokeSession = useMutation({
    mutationFn: async (sessionId: string) => {
      const res = await apiClient.delete<{ success: boolean; message: string }>(
        `/profile/sessions/${sessionId}`
      );
      return res.data;
    },
    onSuccess: (data) => {
      notifications.show({
        title: "Thành công",
        message: data.message || "Đã đăng xuất thiết bị thành công.",
        color: "teal",
      });
    },
    onError: (error: any) => {
      notifications.show({
        title: "Lỗi",
        message: extractErrorMessage(error, "Không thể đăng xuất thiết bị này. Vui lòng thử lại."),
        color: "red",
      });
    },
    onSettled: () => {
      // Luôn làm mới danh sách session sau khi hoàn tất mutation (kể cả khi 404)
      queryClient.invalidateQueries({ queryKey: ["profile", "sessions"] });
    },
  });

  const revokeOtherSessions = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post<{ success: boolean; count: number; message: string }>(
        "/profile/sessions/revoke-others"
      );
      return res.data;
    },
    onSuccess: (data) => {
      notifications.show({
        title: "Thành công",
        message: data.message || "Đã đăng xuất khỏi tất cả các thiết bị khác.",
        color: "teal",
      });
    },
    onError: (error: any) => {
      notifications.show({
        title: "Lỗi",
        message: extractErrorMessage(error, "Không thể đăng xuất các thiết bị khác. Vui lòng thử lại."),
        color: "red",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", "sessions"] });
    },
  });

  return { revokeSession, revokeOtherSessions };
}
