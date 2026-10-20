"use client";

import { useSession } from "@/lib/auth-client";
import { Text } from "@mantine/core";
import SettingsSkeleton from "../_components/SettingsSkeleton";
import ChangePasswordForm from "./_components/ChangePasswordForm";

export default function SettingsPasswordPage() {
  const { data: sessionData, isPending } = useSession();

  if (isPending) return <SettingsSkeleton />;

  if (!sessionData?.user) {
    return (
      <Text size="sm" className="text-text-muted">
        Không thể tải thông tin tài khoản. Vui lòng thử lại sau.
      </Text>
    );
  }

  return <ChangePasswordForm />;
}
