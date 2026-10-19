"use client";

import { SimpleGrid, Stack, Text, TextInput } from "@mantine/core";
import type { CaseContactErrors, CaseContactValues } from "../../../_components/case-contact";

interface CaseContactFieldsProps {
  values: CaseContactValues;
  errors: CaseContactErrors;
  onChange: (field: keyof CaseContactValues, value: string) => void;
  showHint: boolean;
}

export default function CaseContactFields({ values, errors, onChange, showHint }: CaseContactFieldsProps) {
  const bind = (field: keyof CaseContactValues) => ({
    name: field,
    value: values[field],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange(field, e.target.value),
    error: errors[field],
    radius: "md" as const,
  });

  return (
    <Stack gap="sm">
      <div>
        <Text fw={500} size="lg">Người liên hệ</Text>
        <Text size="sm" c="dimmed">
          Chỉ áp dụng cho dự án này, không thay đổi hồ sơ tài khoản của bạn.
        </Text>
        {showHint && (
          <Text size="sm" c="brand">
            Điền đủ họ tên, số điện thoại và email để nhận thông báo và dùng cho thanh toán.
          </Text>
        )}
      </div>
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        <TextInput label="Họ tên người liên hệ" placeholder="Nguyễn Văn A" withAsterisk {...bind("full_name")} />
        <TextInput label="Mã sinh viên" placeholder="SE123456" {...bind("student_code")} />
        <TextInput label="Vai trò trong nhóm" placeholder="Trưởng nhóm" {...bind("team_role")} />
        <TextInput label="Số điện thoại / Zalo" placeholder="10 chữ số" inputMode="numeric" withAsterisk {...bind("zalo")} />
        <TextInput label="Email liên hệ" placeholder="ten@example.com" withAsterisk {...bind("email")} />
        <TextInput label="Telegram" placeholder="@username" {...bind("telegram")} />
      </SimpleGrid>
    </Stack>
  );
}
