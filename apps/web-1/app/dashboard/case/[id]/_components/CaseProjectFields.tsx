"use client";

import { SimpleGrid, Stack, Text, TextInput } from "@mantine/core";

export interface CaseProjectValues {
  teamName: string;
  groupNo: string;
  school: string;
  courseContext: string;
}

interface CaseProjectFieldsProps {
  values: CaseProjectValues;
  errors: Partial<Record<keyof CaseProjectValues, string>>;
  onChange: (field: keyof CaseProjectValues, value: string) => void;
}

export default function CaseProjectFields({ values, errors, onChange }: CaseProjectFieldsProps) {
  const bind = (field: keyof CaseProjectValues) => ({
    name: field,
    value: values[field],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange(field, e.target.value),
    error: errors[field],
    radius: "md" as const,
  });

  return (
    <Stack gap="sm">
      <div>
        <Text fw={500} size="lg">Thông tin dự án</Text>
        <Text size="sm" c="dimmed">
          Cập nhật tên nhóm, trường học và bối cảnh lớp học để báo cáo phản biện hiển thị chính xác.
        </Text>
      </div>
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        <TextInput label="Tên nhóm / Tên đề tài" placeholder="Nhập tên nhóm hoặc đề tài" withAsterisk {...bind("teamName")} />
        <TextInput label="Mã số nhóm / Số thứ tự" placeholder="Ví dụ: 5" {...bind("groupNo")} />
        <TextInput label="Trường học / Viện đào tạo" placeholder="Ví dụ: Đại học FPT" withAsterisk {...bind("school")} />
        <TextInput label="Lớp học / Môn học" placeholder="Ví dụ: EXE101" withAsterisk {...bind("courseContext")} />
      </SimpleGrid>
    </Stack>
  );
}
