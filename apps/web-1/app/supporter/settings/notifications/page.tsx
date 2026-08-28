"use client";

import { useSession } from "@/lib/auth-client";
import { Text } from "@mantine/core";
import { Loader2 } from "lucide-react";
import NotificationPreferencesForm from "../../../dashboard/settings/notifications/_components/NotificationPreferencesForm";

export default function SupporterSettingsNotificationsPage() {
  const { data: sessionData, isPending } = useSession();

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    );
  }

  if (!sessionData?.user) {
    return (
      <Text size="sm" className="text-text-muted">
        Không thể tải thông tin tài khoản. Vui lòng thử lại sau.
      </Text>
    );
  }

  return <NotificationPreferencesForm />;
}
