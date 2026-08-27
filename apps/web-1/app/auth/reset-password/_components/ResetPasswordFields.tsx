import { PasswordInput } from "@mantine/core";

export function passwordValidator({ value }: { value: string }) {
  if (!value) return "Mật khẩu mới là bắt buộc";
  if (value.length < 8) return "Mật khẩu mới phải ít nhất 8 ký tự.";
  return undefined;
}

export function firstFieldError(errors: unknown[]): string | undefined {
  const error = errors[0];
  return typeof error === "string" ? error : undefined;
}

type TextFieldProps = {
  name: string;
  value: string;
  error?: string;
  disabled: boolean;
  onBlur: () => void;
  onChange: (value: string) => void;
};
export function NewPasswordField({ name, value, error, disabled, onBlur, onChange }: TextFieldProps) {
  return (
    <PasswordInput
      id="password"
      name={name}
      value={value}
      onBlur={onBlur}
      onChange={(e) => onChange(e.target.value)}
      label="Mật khẩu mới"
      placeholder="Ít nhất 8 ký tự"
      error={error}
      required
      radius="md"
      disabled={disabled}
    />
  );
}

export function ConfirmPasswordField({ name, value, error, disabled, onBlur, onChange }: TextFieldProps) {
  return (
    <PasswordInput
      id="confirmPassword"
      name={name}
      value={value}
      onBlur={onBlur}
      onChange={(e) => onChange(e.target.value)}
      label="Xác nhận mật khẩu mới"
      placeholder="Nhập lại mật khẩu mới"
      error={error}
      required
      radius="md"
      disabled={disabled}
    />
  );
}
