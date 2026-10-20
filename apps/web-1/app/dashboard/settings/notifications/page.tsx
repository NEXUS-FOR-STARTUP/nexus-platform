"use client";

import { useSession } from "@/lib/auth-client";
import { Text } from "@mantine/core";
import SettingsSkeleton from "../_components/SettingsSkeleton";
import NotificationPreferencesForm from "./_components/NotificationPreferencesForm";

export default function SettingsNotificationsPage() {
  const { data: sessionData, isPending } = useSession();

  if (isPending) return <SettingsSkeleton />;

  if (!sessionData?.user) {
    return (
      <Text size="sm" className="text-text-muted">
        Không thể tải thông tin tài khoản. Vui lòng thử lại sau.
      </Text>
    );
  }

  return <NotificationPreferencesForm />;
}
