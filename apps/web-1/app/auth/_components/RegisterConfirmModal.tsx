"use client";

import { Modal } from "@mantine/core";
import base from "@/components/landing/landing.module.css";
import { AuthButton } from "./AuthButton";
import s from "./auth.module.css";

interface RegisterConfirmModalProps {
  opened: boolean;
  email: string;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function RegisterConfirmModal({
  opened,
  email,
  loading,
  onClose,
  onConfirm,
}: RegisterConfirmModalProps) {
  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={<span className={`${base.landing} ${s.modalTitle}`}>Chưa có tài khoản</span>}
      centered
      size="md"
      radius="md"
      padding="xl"
    >
      {/* The modal renders in a portal outside the landing wrapper, so it re-declares the tokens. */}
      <div className={`${base.landing} ${s.stack}`}>
        <p className={s.modalText}>
          Email {email} chưa đăng ký tài khoản Nexus. Bạn có muốn đăng ký ngay không?
        </p>
        <div className={s.modalActions}>
          <AuthButton variant="ghost" onClick={handleClose} disabled={loading}>
            Hủy
          </AuthButton>
          <AuthButton onClick={onConfirm} loading={loading}>
            Đăng ký
          </AuthButton>
        </div>
      </div>
    </Modal>
  );
}
