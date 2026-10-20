"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { apiClient } from "@/lib/api-client";
import { notifications } from "@mantine/notifications";
import { extractApiErrorMessage } from "./extract-api-error";
import { validateAvatarFile } from "./avatar-limits";

export function useChangeAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      validateAvatarFile(file);
      const formData = new FormData();
      formData.append("file", file);
      const response = await apiClient.post<{ url: string; publicId: string }>(
        "/profile/avatar",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      return response.data;
    },
    onSuccess: () => {
      void authClient.getSession();
      queryClient.invalidateQueries({ queryKey: ["session"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      notifications.show({
        title: "Thành công",
        message: "Đã cập nhật ảnh đại diện.",
        color: "green",
      });
    },
    onError: (err: unknown) =>
      notifications.show({
        title: "Lỗi",
        message: extractApiErrorMessage(err) || "Không thể cập nhật ảnh đại diện.",
        color: "red",
      }),
  });
}
