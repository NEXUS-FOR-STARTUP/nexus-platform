"use client";

import { Stack, TextInput } from "@mantine/core";

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
    <Stack gap="md">
      <TextInput
        label="Tên hiển thị"
        placeholder="Nhập tên hiển thị"
        withAsterisk
        value={name.value}
        onBlur={name.onBlur}
        onChange={(e) => name.onChange(e.currentTarget.value)}
        error={name.error}
        size="md"
      />
      <TextInput
        label="Email đăng nhập"
        description="Không thể thay đổi"
        value={email ?? ""}
        disabled
        size="md"
      />
    </Stack>
  );
}
