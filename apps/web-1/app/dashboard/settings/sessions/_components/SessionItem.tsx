"use client";

import { Badge, Button, Group, Paper, Stack, Text } from "@mantine/core";
import { Laptop, Smartphone, Tablet, Globe, LogOut } from "lucide-react";
import type { ActiveSessionDto } from "@repo/validation";
import { parseUserAgent, formatIpAddress } from "@/lib/utils/ua-parser";

interface SessionItemProps {
  session: ActiveSessionDto;
  onRevoke: (sessionId: string) => void;
  isRevoking: boolean;
}

export function SessionItem({ session, onRevoke, isRevoking }: SessionItemProps) {
  const parsed = parseUserAgent(session.userAgent);
  const formattedIp = formatIpAddress(session.ipAddress);

  const createdAtDate = new Date(session.createdAt);
  const formattedCreatedAt = !isNaN(createdAtDate.getTime())
    ? createdAtDate.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Không xác định";

  const renderDeviceIcon = () => {
    switch (parsed.deviceType) {
      case "desktop":
        return <Laptop className="w-5 h-5" />;
      case "mobile":
        return <Smartphone className="w-5 h-5" />;
      case "tablet":
        return <Tablet className="w-5 h-5" />;
      default:
        return <Globe className="w-5 h-5" />;
    }
  };

  return (
    <Paper
      p="md"
      radius="md"
      className="bg-surface-app border border-border-app transition-colors hover:border-brand-subtle"
    >
      <Group justify="space-between" align="center" wrap="wrap" gap="md">
        <Group gap="md" align="center">
          <div className="w-10 h-10 rounded-full bg-brand-soft text-brand flex items-center justify-center shrink-0">
            {renderDeviceIcon()}
          </div>
          <Stack gap={2}>
            <Group gap="xs" align="center">
              <Text size="sm" fw={600} className="text-text-primary">
                {parsed.os} • {parsed.browser}
              </Text>
              {session.isCurrent && (
                <Badge color="teal" variant="light" size="sm">
                  Phiên hiện tại
                </Badge>
              )}
            </Group>
            <Text size="xs" c="dimmed">
              IP: {formattedIp} • Đăng nhập lúc: {formattedCreatedAt}
            </Text>
          </Stack>
        </Group>

        {!session.isCurrent && (
          <Button
            color="red"
            variant="light"
            size="xs"
            leftSection={<LogOut className="w-3.5 h-3.5" />}
            loading={isRevoking}
            disabled={isRevoking}
            onClick={() => onRevoke(session.id)}
          >
            Đăng xuất
          </Button>
        )}
      </Group>
    </Paper>
  );
}
