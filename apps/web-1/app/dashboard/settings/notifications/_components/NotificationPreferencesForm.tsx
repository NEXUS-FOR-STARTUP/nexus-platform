"use client";

import { useEffect, useState } from "react";
import { Button, Divider, Paper, Stack, Switch, Text } from "@mantine/core";
import { DEFAULT_NOTIFICATION_PREFERENCES, type NotificationPreference } from "@/types/notification";
import { useNotificationPreferences } from "../../hooks/useNotificationPreferences";

type ActivePreferenceKey = keyof Pick<
  NotificationPreference,
  "case_status_updates" | "payment_alerts" | "in_app_enabled" | "email_enabled"
>;

type PreferenceSwitch = {
  key: ActivePreferenceKey;
  label: string;
  description: string;
};

const GROUP_SWITCHES: PreferenceSwitch[] = [
  {
    key: "case_status_updates",
    label: "Cập nhật trạng thái dự án",
    description: "Nhận thông báo khi dự án được duyệt, từ chối, gán supporter hoặc đổi giai đoạn.",
  },
  {
    key: "payment_alerts",
    label: "Cảnh báo thanh toán",
    description: "Nhận thông báo về thanh toán, nạp tiền, đơn hàng và số dư ví.",
  },
];

const CHANNEL_SWITCHES: PreferenceSwitch[] = [
  {
    key: "in_app_enabled",
    label: "Thông báo trong ứng dụng",
    description: "Hiển thị thông báo trên chuông thông báo trong Nexus.",
  },
  {
    key: "email_enabled",
    label: "Email",
    description: "Gửi thông báo tới email đã đăng ký.",
  },
];

function withReservedTrue(draft: NotificationPreference): NotificationPreference {
  return {
    ...draft,
    telegram_enabled: true,
    chat_messages: true,
    marketing_news: true,
  };
}

function PreferenceSwitches({
  items,
  draft,
  disabled,
  onToggle,
}: {
  items: PreferenceSwitch[];
  draft: NotificationPreference;
  disabled: boolean;
  onToggle: (key: ActivePreferenceKey, checked: boolean) => void;
}) {
  return items.map((item) => (
    <Switch
      key={item.key}
      checked={draft[item.key]}
      disabled={disabled}
      color="brand"
      label={item.label}
      description={item.description}
      onChange={(event) => {
        const checked = event.currentTarget.checked;
        onToggle(item.key, checked);
      }}
    />
  ));
}

export default function NotificationPreferencesForm() {
  const { query, save } = useNotificationPreferences();
  const [draft, setDraft] = useState<NotificationPreference | null>(null);

  useEffect(() => {
    if (!query.data) return;
    setDraft({
      email_enabled: query.data.email_enabled,
      telegram_enabled: query.data.telegram_enabled,
      in_app_enabled: query.data.in_app_enabled,
      case_status_updates: query.data.case_status_updates,
      chat_messages: query.data.chat_messages,
      payment_alerts: query.data.payment_alerts,
      marketing_news: query.data.marketing_news,
    });
  }, [query.data]);

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

  const disabled = save.isPending;

  const onToggle = (key: ActivePreferenceKey, checked: boolean) => {
    setDraft((current) => (current ? { ...current, [key]: checked } : current));
  };

  return (
    <Paper p="xl" radius="md" className="bg-surface-app border border-border-app max-w-md">
      <Stack gap="lg">
        <div>
          <Text fw={600}>Cài đặt thông báo</Text>
          <Text size="sm" className="text-text-muted">
            Chọn nhóm và kênh bạn muốn nhận. Nhấn Lưu để áp dụng.
          </Text>
        </div>

        <Stack gap="sm">
          <Stack gap={4}>
            <Text fw={600} size="sm">
              Nhóm thông báo
            </Text>
            <Text size="sm" className="text-text-muted">
              Tắt nhóm thì không nhận loại đó.
            </Text>
          </Stack>
          <PreferenceSwitches items={GROUP_SWITCHES} draft={draft} disabled={disabled} onToggle={onToggle} />
        </Stack>

        <Divider className="border-border-app" />

        <Stack gap="sm">
          <Stack gap={4}>
            <Text fw={600} size="sm">
              Kênh nhận
            </Text>
            <Text size="sm" className="text-text-muted">
              Tắt kênh thì không gửi qua kênh đó.
            </Text>
          </Stack>
          <PreferenceSwitches items={CHANNEL_SWITCHES} draft={draft} disabled={disabled} onToggle={onToggle} />
        </Stack>

        <Button
          color="brand"
          loading={save.isPending}
          onClick={() => save.mutate(withReservedTrue(draft ?? { ...DEFAULT_NOTIFICATION_PREFERENCES }))}
        >
          Lưu
        </Button>
      </Stack>
    </Paper>
  );
}
