"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authClient, updateUser, signOut } from "@/lib/auth-client";
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

// QUAN TRỌNG: Better Auth updateUser KHÔNG throw khi lỗi —
// trả { data, error }. mutationFn phải tự check và throw, nếu không onError
// không bao giờ chạy và onSuccess chạy cả khi lỗi (toast xanh sai).
export function useProfileMutations() {
  const router = useRouter();
  const queryClient = useQueryClient();
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

  const deleteAccount = useMutation({
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

  return {
    updateName,
    changePassword,
    setPassword,
    changeAvatar,
    deleteAccount,
  };
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

