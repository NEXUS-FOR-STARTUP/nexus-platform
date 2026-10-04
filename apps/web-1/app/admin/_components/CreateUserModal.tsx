"use client";

import React, { useState } from "react";
import { UserPlus, Mail, User, Info } from "lucide-react";
import { Modal, Button, TextInput, Select } from "@mantine/core";

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { email: string; name: string; role?: string }) => Promise<void>;
  isSubmitting: boolean;
}

export default function CreateUserModal({ isOpen, onClose, onConfirm, isSubmitting }: CreateUserModalProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<string>("user");
  const [error, setError] = useState("");

  const handleClose = () => {
    setEmail("");
    setName("");
    setRole("user");
    setError("");
    onClose();
  };

  const handleSubmit = async () => {
    setError("");

    if (!email.trim()) {
      setError("Vui lòng nhập email.");
      return;
    }
    if (!name.trim()) {
      setError("Vui lòng nhập họ tên.");
      return;
    }

    try {
      await onConfirm({ email: email.trim(), name: name.trim(), role });
      handleClose();
    } catch {
      // Error handled by parent via notifications
    }
  };

  return (
    <Modal
      opened={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-2 text-brand font-heading font-semibold text-sm">
          <UserPlus className="w-4 h-4 text-brand shrink-0" />
          <span>Tạo người dùng mới</span>
        </div>
      }
      size="md"
      radius="md"
      centered
    >
      <div className="space-y-4 font-body text-xs text-text-app">
        <TextInput
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="user@example.com"
          leftSection={<Mail className="w-4 h-4 text-text-muted" />}
          required
          radius="md"
          size="sm"
          error={error && !email.trim() ? error : undefined}
        />

        <TextInput
          label="Họ tên"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nguyễn Văn A"
          leftSection={<User className="w-4 h-4 text-text-muted" />}
          required
          radius="md"
          size="sm"
          error={error && email.trim() && !name.trim() ? error : undefined}
        />

        <Select
          label="Vai trò"
          value={role}
          onChange={(value) => setRole(value || "user")}
          data={[
            { value: "user", label: "Student" },
            { value: "supporter", label: "Supporter" },
            { value: "admin", label: "Admin" },
          ]}
          radius="md"
          size="sm"
        />

        <div className="p-3 rounded-lg bg-surface-soft border border-border-app flex items-start gap-2.5">
          <Info className="w-4 h-4 text-brand shrink-0 mt-0.5" />
          <p className="text-xs text-text-muted leading-relaxed">
            Mật khẩu sẽ được tạo tự động và gửi qua email cho người dùng. Admin không cần nhập mật khẩu.
          </p>
        </div>

        {error && email.trim() && name.trim() && (
          <p className="text-danger text-xs">{error}</p>
        )}

        <div className="flex gap-3 pt-4 border-t border-border-app">
          <Button
            onClick={handleClose}
            disabled={isSubmitting}
            variant="default"
            className="flex-1 font-body font-semibold text-xs h-9.5 cursor-pointer"
          >
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!email.trim() || !name.trim() || isSubmitting}
            color="brand"
            className="flex-1 font-body font-semibold text-xs h-9.5 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? "Đang tạo..." : "Tạo tài khoản"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
