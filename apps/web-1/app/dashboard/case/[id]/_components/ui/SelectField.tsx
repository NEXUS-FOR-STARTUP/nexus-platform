"use client";

import { Select } from "@mantine/core";
import { CaretDownIcon } from "@phosphor-icons/react";
import s from "./SelectField.module.css";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  label: string;
  name: string;
  value: string;
  options: ReadonlyArray<SelectOption>;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
}

/** Same look as FormField; Mantine Select because a native popup cannot be styled. `data-field` lets forms focus the first invalid control. */
export default function SelectField({
  label,
  name,
  value,
  options,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  error,
}: SelectFieldProps) {
  return (
    <div className={s.field}>
      <Select
        label={required ? `${label} *` : label}
        data-field={name}
        data={options as SelectOption[]}
        value={value || null}
        onChange={(next) => onChange(next ?? "")}
        placeholder={placeholder}
        disabled={disabled}
        error={error}
        allowDeselect={false}
        checkIconPosition="right"
        rightSection={<CaretDownIcon size={16} aria-hidden />}
        classNames={{
          label: s.label,
          input: s.input,
          error: s.error,
          dropdown: s.dropdown,
          option: s.option,
        }}
      />
    </div>
  );
}
