"use client";

import { TextInput } from "@mantine/core";
import type { CaseContactErrors, CaseContactValues } from "../../../_components/case-contact";

interface CaseContactFieldsProps {
  values: CaseContactValues;
  errors: CaseContactErrors;
  onChange: (field: keyof CaseContactValues, value: string) => void;
  showHint: boolean;
}

export default function CaseContactFields({ values, errors, onChange, showHint }: CaseContactFieldsProps) {
  const bind = (field: keyof CaseContactValues) => ({
    value: values[field],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange(field, e.target.value),
    error: errors[field],
    radius: "md" as const,
  });

  return (
    <div className="space-y-3 pt-2">
      <div>
        <h4 className="font-heading font-semibold text-sm text-text-app">Thông tin liên hệ</h4>
        <p className="text-text-muted text-xs mt-1">
          Chỉ áp dụng cho dự án này, không thay đổi hồ sơ tài khoản của bạn.
        </p>
        {showHint && (
          <p className="text-brand text-xs mt-1">
            Điền đủ họ tên, số điện thoại và email để nhận thông báo và dùng cho thanh toán.
          </p>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextInput label="Họ tên người liên hệ" placeholder="Nguyễn Văn A" {...bind("full_name")} />
        <TextInput label="Mã sinh viên" placeholder="SE123456" {...bind("student_code")} />
        <TextInput label="Vai trò trong nhóm" placeholder="Trưởng nhóm" {...bind("team_role")} />
        <TextInput label="Số điện thoại / Zalo" placeholder="10 chữ số" inputMode="numeric" {...bind("zalo")} />
        <TextInput label="Email liên hệ" placeholder="ten@example.com" {...bind("email")} />
        <TextInput label="Telegram" placeholder="@username" {...bind("telegram")} />
      </div>
    </div>
  );
}
