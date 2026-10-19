"use client";

import type { CaseContactErrors, CaseContactValues } from "../../../_components/case-contact";
import FormField from "./ui/FormField";
import s from "./settings-tab.module.css";

interface CaseContactFieldsProps {
  values: CaseContactValues;
  errors: CaseContactErrors;
  onChange: (field: keyof CaseContactValues, value: string) => void;
}

export default function CaseContactFields({ values, errors, onChange }: CaseContactFieldsProps) {
  const bind = (field: keyof CaseContactValues) => ({
    name: field,
    value: values[field],
    onChange: (value: string) => onChange(field, value),
    error: errors[field],
  });

  return (
    <>
      <h2 className={`${s.section} ${s.contactSection}`}>Người liên hệ</h2>
      <p className={s.contactNote}>
        Chỉ áp dụng cho dự án này, không thay đổi hồ sơ tài khoản của bạn. Dùng để báo kết quả và thanh toán.
      </p>
      <div className={s.two}>
        <FormField label="Họ tên" placeholder="Nguyễn Văn A" required {...bind("full_name")} />
        <FormField label="Mã sinh viên" placeholder="SE123456" {...bind("student_code")} />
        <FormField label="Vai trò trong nhóm" placeholder="Trưởng nhóm" {...bind("team_role")} />
        <FormField label="Số điện thoại / Zalo" placeholder="10 chữ số" type="tel" inputMode="numeric" required {...bind("zalo")} />
        <FormField label="Email" placeholder="ten@example.com" type="email" required {...bind("email")} />
        <FormField label="Telegram" placeholder="@username" {...bind("telegram")} />
      </div>
    </>
  );
}
