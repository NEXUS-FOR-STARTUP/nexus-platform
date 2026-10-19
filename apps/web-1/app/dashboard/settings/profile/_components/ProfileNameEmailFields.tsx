"use client";

import { TextInput } from "@mantine/core";
import styles from "../profile.module.css";

interface ProfileNameEmailFieldsProps {
  name: {
    value: string;
    error?: string;
    onChange: (value: string) => void;
    onBlur: () => void;
  };
  email?: string | null;
}

export function ProfileNameEmailFields({ name, email }: ProfileNameEmailFieldsProps) {
  return (
    <div>
      <TextInput
        label="Tên hiển thị"
        placeholder="Nhập tên hiển thị"
        withAsterisk
        value={name.value}
        onBlur={name.onBlur}
        onChange={(e) => name.onChange(e.currentTarget.value)}
        error={name.error}
        classNames={{
          root: styles.inputRoot,
          label: styles.inputLabel,
          input: styles.inputField,
          error: styles.inputError,
        }}
      />
      <TextInput
        label="Email đăng nhập"
        description="Không thể thay đổi"
        value={email ?? ""}
        disabled
        classNames={{
          root: styles.inputRoot,
          label: styles.inputLabel,
          input: styles.inputField,
        }}
      />
    </div>
  );
}
