"use client";

import { useState } from "react";
import { Trash as Trash2, Warning as TriangleAlert } from "@phosphor-icons/react";
import { useDeleteAccount } from "../../hooks/useDeleteAccount";
import styles from "../profile.module.css";
import { DeleteAccountModal } from "./DeleteAccountModal";

export function DangerZoneCard() {
  const deleteAccount = useDeleteAccount();
  const [opened, setOpened] = useState(false);

  return (
    <>
      <div className={styles.dangerBox}>
        <h2 className={styles.dangerHead}>
          <TriangleAlert size={20} />
          <span>Vùng nguy hiểm</span>
        </h2>
        <p className={styles.note} style={{ marginBottom: "16px" }}>
          Xóa tài khoản của bạn và toàn bộ thông tin cá nhân. Hành động này không thể hoàn tác.
        </p>
        <button
          type="button"
          className={styles.dangerBtn}
          onClick={() => setOpened(true)}
        >
          <Trash2 size={16} />
          <span>Xóa tài khoản</span>
        </button>
      </div>

      <DeleteAccountModal
        opened={opened}
        onClose={() => setOpened(false)}
        onConfirm={() => deleteAccount.mutate()}
        loading={deleteAccount.isPending}
      />
    </>
  );
}
