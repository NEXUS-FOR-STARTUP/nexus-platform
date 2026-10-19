"use client";

import { Button, Paper } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Trash as Trash2, Warning as TriangleAlert } from "@phosphor-icons/react";
import { useDeleteAccount } from "../../hooks/useDeleteAccount";
import styles from "../profile.module.css";
import { DeleteAccountModal } from "./DeleteAccountModal";

export function DangerZoneCard() {
  const deleteAccount = useDeleteAccount();
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <>
      <Paper withBorder className={styles.dangerCard}>
        <h2 className={styles.dangerTitle}>
          <TriangleAlert className="w-5 h-5 flex-shrink-0" aria-hidden />
          <span>Vùng nguy hiểm</span>
        </h2>
        <p className={`${styles.note} mb-4`}>
          Xóa tài khoản của bạn và toàn bộ thông tin cá nhân. Hành động này không thể hoàn tác.
        </p>
        <Button
          className={styles.dangerBtn}
          size="sm"
          leftSection={<Trash2 className="w-4 h-4" />}
          onClick={open}
        >
          Xóa tài khoản
        </Button>
      </Paper>

      <DeleteAccountModal
        opened={opened}
        onClose={close}
        onConfirm={() => deleteAccount.mutate()}
        loading={deleteAccount.isPending}
      />
    </>
  );
}
