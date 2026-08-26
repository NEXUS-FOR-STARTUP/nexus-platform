"use client";

import { useMutation } from "@tanstack/react-query";
import { updateUser, changePassword } from "@/lib/auth-client";
import { apiClient } from "@/lib/api-client";
import { notifications } from "@mantine/notifications";
import { translateAuthError } from "@/lib/auth-errors";

const ALLOWED_AVATAR_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
const MAX_AVATAR_FILE_SIZE_BYTES = 2 * 1024 * 1024;

function extractApiErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const axiosErr = error as {
      response?: { data?: { message?: string } };
    };
    if (axiosErr.response?.data?.message) {
      return axiosErr.response.data.message;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "";
}

function validateAvatarFile(file: File) {
  const dot = file.name.lastIndexOf(".");
  const extension = dot >= 0 ? file.name.slice(dot).toLowerCase() : "";
  if (!ALLOWED_AVATAR_EXTENSIONS.includes(extension)) {
    throw new Error("Chỉ hỗ trợ ảnh .jpg, .jpeg, .png hoặc .webp");
  }
  if (file.size > MAX_AVATAR_FILE_SIZE_BYTES) {
    throw new Error("Dung lượng ảnh tối đa là 2MB");
  }
}

// QUAN TRỌNG: Better Auth updateUser/changePassword KHÔNG throw khi lỗi —
// trả { data, error }. mutationFn phải tự check và throw, nếu không onError
// không bao giờ chạy và onSuccess chạy cả khi lỗi (toast xanh sai).
export function useProfileMutations() {
  const updateName = useMutation({
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

  const changePasswordMutation = useMutation({
    mutationFn: async (input: { currentPassword: string; newPassword: string }) => {
      const result = await changePassword({ ...input, revokeOtherSessions: true });
      if (result.error) throw new Error(result.error.message || "change password failed");
      return result.data;
    },
    onSuccess: () =>
      notifications.show({
        title: "Thành công",
        message: "Đã đổi mật khẩu thành công. Các thiết bị khác đã được đăng xuất.",
        color: "green",
      }),
    onError: (err: unknown) =>
      notifications.show({
        title: "Lỗi",
        message:
          translateAuthError(err instanceof Error ? err.message : "") ||
          "Không thể đổi mật khẩu. Kiểm tra lại mật khẩu hiện tại.",
        color: "red",
      }),
  });

  const changeAvatar = useMutation({
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
    onSuccess: () =>
      notifications.show({
        title: "Thành công",
        message: "Đã cập nhật ảnh đại diện.",
        color: "green",
      }),
    onError: (err: unknown) =>
      notifications.show({
        title: "Lỗi",
        message: extractApiErrorMessage(err) || "Không thể cập nhật ảnh đại diện.",
        color: "red",
      }),
  });

  return { updateName, changePassword: changePasswordMutation, changeAvatar };
}
