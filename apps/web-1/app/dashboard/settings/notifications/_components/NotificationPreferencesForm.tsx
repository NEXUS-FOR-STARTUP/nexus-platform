"use client";

import { Group, Paper, Stack, Switch, Text } from "@mantine/core";
import { useNotificationPreferences } from "../../hooks/useNotificationPreferences";
import classes from "../notifications.module.css";

export default function NotificationPreferencesForm() {
  const { query, save } = useNotificationPreferences();
  // Optimistic value only while saving; on error query.data is unchanged => auto rollback.
  const enabled = save.isPending ? save.variables.email_enabled : query.data?.email_enabled;

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

        <Group justify="space-between" wrap="nowrap">
          <div>
            <Text className={classes.label}>Nhận email</Text>
            <Text className={classes.note}>Gửi thông báo tới email đã đăng ký.</Text>
          </div>
          <Switch
            checked={enabled}
            disabled={save.isPending}
            color="brand"
            aria-label="Nhận email"
            onChange={(event) => {
              if (save.isPending) return;
              const checked = event.currentTarget.checked;
              if (checked === enabled) return;
              save.mutate({ email_enabled: checked });
            }}
          />
        </Group>
      </Stack>
    </Paper>
  );
}
