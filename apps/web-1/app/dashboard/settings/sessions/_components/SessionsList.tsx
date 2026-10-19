"use client";

import { useDisclosure } from "@mantine/hooks";
import { Alert, Button, Group, Skeleton, Stack, Text } from "@mantine/core";
import { AlertCircle, LogOut, RefreshCw } from "lucide-react";
import { useActiveSessionsQuery } from "../../hooks/useSessionQueries";
import { useSessionMutations } from "../../hooks/useSessionMutations";
import { SessionItem } from "./SessionItem";
import { RevokeOthersModal } from "./RevokeOthersModal";
import classes from "../sessions.module.css";

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
    <Stack gap="lg">
      <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
        <Stack gap={4}>
          <Text className={classes.title}>Thiết bị & Phiên đăng nhập</Text>
          <Text className={classes.note}>
            Quản lý và thu hồi quyền truy cập của các thiết bị đang đăng nhập tài khoản này.
          </Text>
        </Stack>

        {otherSessionsCount > 0 && (
          <Button
            variant="default"
            size="sm"
            leftSection={<LogOut className="w-4 h-4" />}
            onClick={openRevokeOthers}
            disabled={revokeOtherSessions.isPending}
          >
            Đăng xuất tất cả thiết bị khác
          </Button>
        )}
      </Group>

      {isLoading && (
        <Stack gap="sm">
          <Skeleton className={classes.skeletonRow} radius="md" />
          <Skeleton className={classes.skeletonRow} radius="md" />
          <Skeleton className={classes.skeletonRow} radius="md" />
        </Stack>
      )}

      {isError && (
        <Alert color="red" variant="light" icon={<AlertCircle className="w-5 h-5" />}>
          <Group justify="space-between" align="center" gap="md">
            <Text size="sm">
              Không thể tải danh sách phiên đăng nhập. Vui lòng thử lại.
            </Text>
            <Button
              variant="default"
              size="sm"
              leftSection={<RefreshCw className="w-4 h-4" />}
              onClick={() => void refetch()}
            >
              Tải lại
            </Button>
          </Group>
        </Alert>
      )}

      {!isLoading && !isError && sessions && (
        <Stack gap="sm">
          {sessions.length === 0 ? (
            <Text className={classes.note} ta="center" py="md">
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

      <RevokeOthersModal
        opened={revokeOthersOpened}
        onClose={closeRevokeOthers}
        onConfirm={handleConfirmRevokeOthers}
        loading={revokeOtherSessions.isPending}
        otherSessionsCount={otherSessionsCount}
      />
    </Stack>
  );
}
