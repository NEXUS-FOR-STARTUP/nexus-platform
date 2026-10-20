"use client";

import { useSession } from "@/lib/auth-client";
import { Text } from "@mantine/core";
import SettingsSkeleton from "../_components/SettingsSkeleton";
import ProfileInfoForm from "./_components/ProfileInfoForm";

export default function SettingsProfilePage() {
  const { data: sessionData, isPending, refetch } = useSession();

  if (isPending) return <SettingsSkeleton />;

  const user = sessionData?.user;

  if (!user) {
    return (
      <Text size="sm" className="text-text-muted">
        Không thể tải thông tin tài khoản. Vui lòng thử lại sau.
      </Text>
    );
  }

  return <ProfileInfoForm user={user} refetch={refetch} />;
}
