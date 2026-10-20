"use client";

import FormField from "./ui/FormField";
import SelectField, { type SelectOption } from "./ui/SelectField";
import s from "./settings-tab.module.css";

export const SCHOOL_FPT = "Đại học FPT";
export const OPTION_OTHER = "Khác";
export const COURSE_EXE101 = "EXE101";

const SCHOOL_OPTIONS: SelectOption[] = [
  { value: SCHOOL_FPT, label: SCHOOL_FPT },
  { value: OPTION_OTHER, label: OPTION_OTHER },
];
const FPT_COURSE_OPTIONS: SelectOption[] = [
  { value: COURSE_EXE101, label: COURSE_EXE101 },
  { value: OPTION_OTHER, label: OPTION_OTHER },
];
const OTHER_COURSE_OPTIONS: SelectOption[] = [{ value: OPTION_OTHER, label: OPTION_OTHER }];

export interface CaseProjectValues {
  teamName: string;
  school: string;
  courseContext: string;
  groupNo: string;
}

/** Group number only exists for the FPT EXE101 cohort; everything else is stored as "Khác" (same as intake). */
export function needsGroupNo(v: Pick<CaseProjectValues, "school" | "courseContext">): boolean {
  return v.school === SCHOOL_FPT && v.courseContext === COURSE_EXE101;
}

interface CaseProjectFieldsProps {
  values: CaseProjectValues;
  errors: Partial<Record<keyof CaseProjectValues, string>>;
  onChange: (field: keyof CaseProjectValues, value: string) => void;
}

export default function CaseProjectFields({ values, errors, onChange }: CaseProjectFieldsProps) {
  // Same cascade as intake: choosing "Khác" fills the dependent fields, choosing FPT clears them to be picked.
  const changeSchool = (school: string) => {
    onChange("school", school);
    const other = school === OPTION_OTHER;
    onChange("courseContext", other ? OPTION_OTHER : "");
    onChange("groupNo", other ? OPTION_OTHER : "");
  };
  const changeCourse = (course: string) => {
    onChange("courseContext", course);
    onChange("groupNo", course === OPTION_OTHER ? OPTION_OTHER : "");
  };

  return (
    <>
      <h2 className={s.section}>Thông tin dự án</h2>
      <div className={s.two}>
        <div className={s.wide}>
          <FormField
            label="Tên nhóm / Tên đề tài"
            placeholder="Nhập tên nhóm hoặc đề tài"
            required
            name="teamName"
            value={values.teamName}
            onChange={(v) => onChange("teamName", v)}
            error={errors.teamName}
          />
        </div>
        <SelectField
          label="Trường học"
          name="school"
          placeholder="Chọn trường học"
          required
          options={SCHOOL_OPTIONS}
          value={values.school}
          onChange={changeSchool}
          error={errors.school}
        />
        <SelectField
          label="Lớp học / Môn học"
          name="courseContext"
          placeholder="Chọn lớp học"
          required
          disabled={!values.school}
          options={values.school === SCHOOL_FPT ? FPT_COURSE_OPTIONS : OTHER_COURSE_OPTIONS}
          value={values.courseContext}
          onChange={changeCourse}
          error={errors.courseContext}
        />
        {needsGroupNo(values) && (
          <FormField
            label="Mã số nhóm"
            placeholder="Ví dụ: 5"
            required
            inputMode="numeric"
            name="groupNo"
            value={values.groupNo}
            onChange={(v) => onChange("groupNo", v)}
            error={errors.groupNo}
          />
        )}
      </div>
    </>
  );
}
