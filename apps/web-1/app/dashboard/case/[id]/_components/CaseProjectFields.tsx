"use client";

import FormField from "./ui/FormField";
import s from "./settings-tab.module.css";

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
    onChange: (value: string) => onChange(field, value),
    error: errors[field],
  });

  return (
    <>
      <h2 className={s.section}>Thông tin dự án</h2>
      <div className={s.two}>
        <FormField label="Tên nhóm / Tên đề tài" placeholder="Nhập tên nhóm hoặc đề tài" required {...bind("teamName")} />
        <FormField label="Mã số nhóm / Số thứ tự" placeholder="Ví dụ: 5" {...bind("groupNo")} />
        <FormField label="Trường học / Viện đào tạo" placeholder="Ví dụ: Đại học FPT" required {...bind("school")} />
        <FormField label="Lớp học / Môn học" placeholder="Ví dụ: EXE101" required {...bind("courseContext")} />
      </div>
    </>
  );
}
