"use client";

import { useSession } from "@/lib/auth-client";
import { Text } from "@mantine/core";
import SettingsSkeleton from "../_components/SettingsSkeleton";
import { SessionsList } from "./_components/SessionsList";

export default function SettingsSessionsPage() {
  const { data: sessionData, isPending } = useSession();

  if (isPending) return <SettingsSkeleton />;

  const user = sessionData?.user;

  if (!user) {
    return (
      <Text size="sm" className="text-text-muted">
        Không thể tải thông tin tài khoản. Vui lòng thử lại sau.
      </Text>
    );
  }

  return <SessionsList />;
}
