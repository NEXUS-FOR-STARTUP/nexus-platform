"use client";

import { Button, Paper, Stack } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Trash2, TriangleAlert } from "lucide-react";
import { useDeleteAccount } from "../../hooks/useDeleteAccount";
import styles from "../profile.module.css";
import { DeleteAccountModal } from "./DeleteAccountModal";

export function DangerZoneCard() {
  const deleteAccount = useDeleteAccount();
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <>
      <Paper p="xl" radius="md" className={styles.dangerCard}>
        <Stack gap="md" align="flex-start">
          <h2 className={`${styles.dangerTitle} flex items-center gap-2`}>
            <TriangleAlert className="w-5 h-5" aria-hidden />
            Vùng nguy hiểm
          </h2>
          <p className={styles.note}>
            Xóa tài khoản của bạn và toàn bộ thông tin cá nhân. Hành động này không thể hoàn tác.
          </p>
          <Button
            color="red"
            variant="light"
            size="sm"
            leftSection={<Trash2 className="w-4 h-4" />}
            onClick={open}
          >
            Xóa tài khoản
          </Button>
        </Stack>
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
