"use client";

import { useId, type HTMLInputTypeAttribute } from "react";
import s from "./FormField.module.css";

interface FormFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  type?: HTMLInputTypeAttribute;
  inputMode?: "numeric" | "tel" | "email" | "text";
}

export default function FormField({
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  error,
  type = "text",
  inputMode,
}: FormFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className={s.field}>
      <label className={s.label} htmlFor={id}>
        {required ? `${label} *` : label}
      </label>
      <input
        id={id}
        className={s.input}
        name={name}
        type={type}
        inputMode={inputMode}
        value={value}
        placeholder={placeholder}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && (
        <p className={s.error} id={errorId}>
          {error}
        </p>
      )}
    </div>
  );
}
