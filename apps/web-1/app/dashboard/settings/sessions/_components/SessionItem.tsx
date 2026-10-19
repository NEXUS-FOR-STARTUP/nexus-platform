"use client";

import { Button, Group, Paper, Stack, Text } from "@mantine/core";
import { Laptop, Smartphone, Tablet, Globe, LogOut } from "lucide-react";
import type { ActiveSessionDto } from "@repo/validation";
import { StatusChip } from "@/components/ui/StatusChip";
import { parseUserAgent, formatIpAddress } from "@/lib/utils/ua-parser";
import classes from "../sessions.module.css";

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

  const deviceName = `${parsed.os} • ${parsed.browser}`;

  return (
    <Paper withBorder radius="md" p="md" className={classes.row}>
      <Group justify="space-between" align="center" wrap="nowrap" gap="md" w="100%">
        <Group gap="md" align="center" wrap="nowrap" miw={0}>
          <div className={classes.iconBox}>{renderDeviceIcon()}</div>
          <Stack gap={2} miw={0}>
            <Group gap="xs" align="center">
              <Text className={classes.deviceName}>{deviceName}</Text>
              {session.isCurrent && <StatusChip tone="ok">Phiên hiện tại</StatusChip>}
            </Group>
            <Text className={classes.meta}>
              IP: {formattedIp} • Đăng nhập lúc: {formattedCreatedAt}
            </Text>
          </Stack>
        </Group>

        {!session.isCurrent && (
          <Button
            variant="default"
            size="sm"
            className={classes.revoke}
            aria-label={`Đăng xuất khỏi ${deviceName}`}
            leftSection={<LogOut className="w-4 h-4" />}
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
