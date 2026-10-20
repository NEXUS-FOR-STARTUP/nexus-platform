"use client";

import { useDisclosure } from "@mantine/hooks";
import { Alert, Skeleton, Text } from "@mantine/core";
import { WarningCircle as AlertCircle, SignOut as LogOut, ArrowsClockwise as RefreshCw } from "@phosphor-icons/react";
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
    <div className={classes.colNarrow}>
      <div className={classes.card}>
        <div className={classes.cardHead}>
          <div>
            <h2 className={classes.title}>Phiên đang hoạt động</h2>
            <p className={classes.note}>
              Nếu phát hiện thiết bị lạ, hãy đăng xuất ngay và đổi mật khẩu.
            </p>
          </div>

          {otherSessionsCount > 0 && (
            <button
              type="button"
              className={classes.btnQuiet}
              onClick={openRevokeOthers}
              disabled={revokeOtherSessions.isPending}
            >
              <LogOut size={16} />
              <span>Đăng xuất khỏi thiết bị khác</span>
            </button>
          )}
        </div>

        {isLoading && (
          <div className={classes.sessionList}>
            <Skeleton className={classes.skeletonRow} />
            <Skeleton className={classes.skeletonRow} />
            <Skeleton className={classes.skeletonRow} />
          </div>
        )}

        {isError && (
          <Alert color="red" variant="light" icon={<AlertCircle size={20} />} className="mb-4">
            <div className="flex justify-between items-center w-full">
              <Text size="sm">
                Không thể tải danh sách phiên đăng nhập. Vui lòng thử lại.
              </Text>
              <button
                type="button"
                className={classes.btnQuiet}
                onClick={() => void refetch()}
              >
                <RefreshCw size={14} />
                <span>Tải lại</span>
              </button>
            </div>
          </Alert>
        )}

        {!isLoading && !isError && sessions && (
          <div className={classes.sessionList}>
            {sessions.length === 0 ? (
              <p className={classes.note} style={{ textAlign: "center", padding: "16px" }}>
                Không tìm thấy phiên đăng nhập nào.
              </p>
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
          </div>
        )}
      </div>

      <RevokeOthersModal
        opened={revokeOthersOpened}
        onClose={closeRevokeOthers}
        onConfirm={handleConfirmRevokeOthers}
        loading={revokeOtherSessions.isPending}
        otherSessionsCount={otherSessionsCount}
      />
    </div>
  );
}
