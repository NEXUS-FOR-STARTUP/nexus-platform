"use client";

import { useState, useEffect } from "react";
import { ShieldAlert, ShieldCheck, AlertTriangle } from "lucide-react";
import { Modal, Button, Select, Text, Badge, Alert } from "@mantine/core";

interface AssignRoleModalProps {
  isOpen: boolean;
  user: {
    userId: string;
    userName: string;
    userEmail: string;
    currentRole: string;
  } | null;
  currentAdminId?: string;
  onClose: () => void;
  onConfirm: (role: string) => Promise<void>;
  isSubmitting: boolean;
}

const ROLE_OPTIONS = [
  { value: "user", label: "Student (Người dùng)" },
  { value: "supporter", label: "Supporter (Hỗ trợ viên)" },
  { value: "admin", label: "Admin (Quản trị viên)" },
];

const roleLabelMap: Record<string, string> = {
  admin: "Admin",
  supporter: "Supporter",
  user: "Student",
};

const roleThemeMap: Record<string, string> = {
  admin: "red",
  supporter: "brand",
  user: "gray",
};

export default function AssignRoleModal({
  isOpen,
  user,
  currentAdminId,
  onClose,
  onConfirm,
  isSubmitting,
}: AssignRoleModalProps) {
  const [selectedRole, setSelectedRole] = useState<string>("user");

  useEffect(() => {
    if (user?.currentRole) {
      setSelectedRole(user.currentRole.toLowerCase());
    }
  }, [user]);

  if (!user) return null;

  const isSelf = Boolean(currentAdminId && user.userId === currentAdminId);
  const isDemotingSelf = isSelf && selectedRole !== "admin";
  const hasChanged = selectedRole !== user.currentRole.toLowerCase();

  const handleConfirm = async () => {
    if (!hasChanged || isDemotingSelf) return;
    try {
      await onConfirm(selectedRole);
    } catch {
      // Error handled by parent
    }
  };

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-1.5 text-brand font-heading font-semibold text-sm">
          <ShieldCheck className="w-4 h-4 text-brand" />
          <span>Phân quyền người dùng</span>
        </div>
      }
      size="md"
      radius="md"
      centered
    >
      <div className="space-y-4 font-body text-xs">
        <div className="p-3 bg-surface-soft border border-border-app rounded-md space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-text-app text-sm">{user.userName}</span>
            <Badge color={roleThemeMap[user.currentRole] || "gray"} variant="light" size="sm">
              Hiện tại: {roleLabelMap[user.currentRole] || user.currentRole}
            </Badge>
          </div>
          <p className="text-text-muted">{user.userEmail}</p>
        </div>

        <Select
          label="Chọn vai trò mới"
          description="Chọn vai trò phù hợp với nhiệm vụ của người dùng trên hệ thống"
          data={ROLE_OPTIONS}
          value={selectedRole}
          onChange={(val) => setSelectedRole(val || "user")}
          radius="md"
          size="sm"
          checkIconPosition="right"
        />

        {selectedRole === "admin" && user.currentRole !== "admin" && (
          <Alert
            icon={<ShieldAlert className="w-4 h-4" />}
            title="Cảnh báo quyền quản trị"
            color="red"
            variant="light"
            radius="md"
          >
            Vai trò <strong>Admin</strong> có toàn quyền truy cập cấu hình hệ thống, quản lý người dùng và duyệt dữ liệu.
          </Alert>
        )}

        {isDemotingSelf && (
          <Alert
            icon={<AlertTriangle className="w-4 h-4" />}
            title="Không thể tự hạ quyền"
            color="yellow"
            variant="light"
            radius="md"
          >
            Bạn đang thao tác trên tài khoản của chính mình. Hệ thống không cho phép tự hạ quyền Admin.
          </Alert>
        )}

        <div className="flex gap-3 pt-3 border-t border-border-app justify-end">
          <Button
            variant="subtle"
            color="gray"
            onClick={onClose}
            disabled={isSubmitting}
            radius="md"
            size="sm"
          >
            Hủy
          </Button>
          <Button
            color="brand"
            onClick={handleConfirm}
            loading={isSubmitting}
            disabled={!hasChanged || isDemotingSelf}
            radius="md"
            size="sm"
          >
            Cập nhật vai trò
          </Button>
        </div>
      </div>
    </Modal>
  );
}
