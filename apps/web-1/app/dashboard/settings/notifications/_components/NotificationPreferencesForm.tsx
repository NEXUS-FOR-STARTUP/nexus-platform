"use client";

import { useState } from "react";
import { Paper, Stack, Switch, Text } from "@mantine/core";
import { useNotificationPreferences } from "../../hooks/useNotificationPreferences";
import classes from "../notifications.module.css";

export default function NotificationPreferencesForm() {
  const { query, save } = useNotificationPreferences();
  // Optimistic value set synchronously in onChange (no flicker); cleared on settle => rollback to query.data on error.
  const [optimistic, setOptimistic] = useState<boolean | null>(null);
  const enabled = optimistic ?? query.data?.email_enabled;

  if (query.isError) {
    return (
      <Text className={classes.note}>
        Không thể tải cài đặt thông báo. Vui lòng thử lại sau.
      </Text>
    );
  }

  if (query.isPending || enabled === undefined) {
    return (
      <Text className={classes.note}>
        Đang tải cài đặt thông báo...
      </Text>
    );
  }

  return (
    <Paper withBorder radius="md" p="lg" className={classes.card}>
      <Stack gap="md">
        <div>
          <Text className={classes.title}>Cài đặt thông báo</Text>
          <Text className={classes.note}>Bật hoặc tắt nhận email thông báo.</Text>
        </div>

        <Switch
          checked={enabled}
          disabled={save.isPending}
          color="brand"
          label="Nhận email"
          description="Gửi thông báo tới email đã đăng ký."
          onChange={(event) => {
            if (save.isPending) return;
            const checked = event.currentTarget.checked;
            if (checked === enabled) return;
            setOptimistic(checked);
            save.mutate({ email_enabled: checked }, { onSettled: () => setOptimistic(null) });
          }}
        />
      </Stack>
    </Paper>
  );
}
