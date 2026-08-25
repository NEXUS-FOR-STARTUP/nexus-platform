import {
  Center,
  PasswordInput,
  PinInput,
  Text,
  TextInput,
} from "@mantine/core";

const OTP_LENGTH = 6;
const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

export function emailValidator({ value }: { value: string }) {
  if (!value) return "Email là bắt buộc";
  if (!EMAIL_REGEX.test(value)) return "Email không đúng định dạng";
  return undefined;
}

export function otpValidator({ value }: { value: string }) {
  return /^\d{6}$/.test(value) ? undefined : "Mã OTP phải gồm đúng 6 chữ số";
}

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

export function EmailField({ name, value, error, disabled, onBlur, onChange }: TextFieldProps) {
  return (
    <TextInput
      id="email"
      type="email"
      name={name}
      value={value}
      onBlur={onBlur}
      onChange={(e) => onChange(e.target.value)}
      label="Địa chỉ Email"
      placeholder="name@example.com"
      error={error}
      required
      radius="md"
      disabled={disabled}
    />
  );
}

export function OtpField({
  value,
  error,
  disabled,
  onChange,
}: {
  value: string;
  error?: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <Text fz="sm" fw={500} mb={6}>
        Mã OTP
      </Text>
      <Center>
        <PinInput
          length={OTP_LENGTH}
          value={value}
          onChange={onChange}
          type="number"
          size="lg"
          radius="md"
          oneTimeCode
          autoFocus
          disabled={disabled}
          ariaLabel="Mã OTP"
        />
      </Center>
      {error && (
        <Text c="red" fz="xs" ta="center" mt={6}>
          {error}
        </Text>
      )}
    </div>
  );
}

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
