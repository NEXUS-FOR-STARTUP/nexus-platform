"use client";

import { useDisclosure } from "@mantine/hooks";
import { Button, Group, Paper, Skeleton, Stack, Text } from "@mantine/core";
import { AlertCircle, LogOut, RefreshCw, Shield } from "lucide-react";
import { useActiveSessionsQuery } from "../../hooks/useSessionQueries";
import { useSessionMutations } from "../../hooks/useSessionMutations";
import { SessionItem } from "./SessionItem";
import { RevokeOthersModal } from "./RevokeOthersModal";

export function SessionsList() {
  const { data: sessions, isLoading, isError, refetch } = useActiveSessionsQuery();
  const { revokeSession, revokeOtherSessions } = useSessionMutations();
  const [
    revokeOthersOpened,
    { open: openRevokeOthers, close: closeRevokeOthers },
  ] = useDisclosure(false);

  const otherSessionsCount = sessions ? sessions.filter((s) => !s.isCurrent).length : 0;

  const handleRevokeSession = (sessionId: string) => {
    revokeSession.mutate(sessionId);
  };

  const handleConfirmRevokeOthers = () => {
    revokeOtherSessions.mutate(undefined, {
      onSuccess: () => {
        closeRevokeOthers();
      },
    });
  };

  return (
    <Paper
      p="xl"
      radius="md"
      className="bg-surface-app border border-border-app"
    >
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
          <Stack gap={4}>
            <Group gap="xs" align="center">
              <Shield className="w-5 h-5 text-brand" />
              <Text fw={600} size="lg" className="font-heading text-text-primary">
                Thiết bị & Phiên đăng nhập
              </Text>
            </Group>
            <Text size="sm" c="dimmed">
              Quản lý và thu hồi quyền truy cập của các thiết bị đang đăng nhập tài khoản này.
            </Text>
          </Stack>

          {otherSessionsCount > 0 && (
            <Button
              color="red"
              variant="light"
              size="sm"
              leftSection={<LogOut className="w-4 h-4" />}
              onClick={openRevokeOthers}
              disabled={revokeOtherSessions.isPending}
            >
              Đăng xuất tất cả thiết bị khác
            </Button>
          )}
        </Group>

        {/* Loading State */}
        {isLoading && (
          <Stack gap="sm">
            <Skeleton height={72} radius="md" />
            <Skeleton height={72} radius="md" />
            <Skeleton height={72} radius="md" />
          </Stack>
        )}

        {/* Error State */}
        {isError && (
          <Paper p="md" radius="sm" className="bg-red-500/10 border border-red-500/20">
            <Group justify="space-between" align="center">
              <Group gap="xs">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <Text size="sm" c="red">
                  Không thể tải danh sách phiên đăng nhập. Vui lòng thử lại.
                </Text>
              </Group>
              <Button
                variant="subtle"
                color="red"
                size="xs"
                leftSection={<RefreshCw className="w-3.5 h-3.5" />}
                onClick={() => void refetch()}
              >
                Tải lại
              </Button>
            </Group>
          </Paper>
        )}

        {/* Sessions List */}
        {!isLoading && !isError && sessions && (
          <Stack gap="sm">
            {sessions.length === 0 ? (
              <Text size="sm" c="dimmed" ta="center" py="md">
                Không tìm thấy phiên đăng nhập nào.
              </Text>
            ) : (
              sessions.map((session) => (
                <SessionItem
                  key={session.id}
                  session={session}
                  onRevoke={handleRevokeSession}
                  isRevoking={
                    revokeSession.isPending && revokeSession.variables === session.id
                  }
                />
              ))
            )}
          </Stack>
        )}
      </Stack>

      <RevokeOthersModal
        opened={revokeOthersOpened}
        onClose={closeRevokeOthers}
        onConfirm={handleConfirmRevokeOthers}
        loading={revokeOtherSessions.isPending}
        otherSessionsCount={otherSessionsCount}
      />
    </Paper>
  );
}
