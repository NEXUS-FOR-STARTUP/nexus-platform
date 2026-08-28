"use client";

import { useEffect, useState } from "react";
import { Button, Paper, Stack, Switch, Text } from "@mantine/core";
import { type NotificationPreference } from "@/types/notification";
import { useNotificationPreferences } from "../../hooks/useNotificationPreferences";

export default function NotificationPreferencesForm() {
  const { query, save } = useNotificationPreferences();
  const [draft, setDraft] = useState<NotificationPreference | null>(null);

  useEffect(() => {
    if (!query.data || save.isPending) return;
    setDraft({ email_enabled: query.data.email_enabled });
  }, [query.data, save.isPending]);

  if (query.isError) {
    return (
      <Text size="sm" className="text-text-muted">
        Không thể tải cài đặt thông báo. Vui lòng thử lại sau.
      </Text>
    );
  }

  if (query.isPending || !draft) {
    return (
      <Text size="sm" className="text-text-muted">
        Đang tải cài đặt thông báo...
      </Text>
    );
  }

  return (
    <Paper p="xl" radius="md" className="bg-surface-app border border-border-app max-w-md">
      <Stack gap="lg">
        <div>
          <Text fw={600}>Cài đặt thông báo</Text>
          <Text size="sm" className="text-text-muted">
            Chọn có nhận email thông báo hay không. Nhấn Lưu để áp dụng.
          </Text>
        </div>

        <Switch
          checked={draft.email_enabled}
          disabled={save.isPending}
          color="brand"
          label="Nhận email"
          description="Gửi thông báo tới email đã đăng ký."
          onChange={(event) => {
            const checked = event.currentTarget.checked;
            setDraft((current) => (current ? { ...current, email_enabled: checked } : current));
          }}
        />

        <Button color="brand" loading={save.isPending} onClick={() => save.mutate(draft)}>
          Lưu
        </Button>
      </Stack>
    </Paper>
  );
}
