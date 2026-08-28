"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";
import { apiClient } from "@/lib/api-client";
import type { NotificationPreference, NotificationPreferenceResponse } from "@/types/notification";

export const notificationPreferencesQueryKey = ["notification-preferences"] as const;

export function useNotificationPreferences() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: notificationPreferencesQueryKey,
    queryFn: async () => {
      const res = await apiClient.get("/notifications/preferences");
      return res.data as NotificationPreferenceResponse;
    },
    refetchOnWindowFocus: false,
  });

  const save = useMutation({
    mutationFn: async (preference: NotificationPreference) => {
      const res = await apiClient.put("/notifications/preferences", preference);
      return res.data as NotificationPreferenceResponse;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(notificationPreferencesQueryKey, data);
      notifications.show({
        title: "Thành công",
        message: "Đã lưu cài đặt thông báo.",
        color: "green",
      });
    },
    onError: () => {
      notifications.show({
        title: "Lỗi",
        message: "Không thể lưu cài đặt thông báo. Vui lòng thử lại.",
        color: "red",
      });
    },
  });

  return { query, save };
}
