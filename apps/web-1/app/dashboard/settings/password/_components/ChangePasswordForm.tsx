"use client";

import { useForm } from "@tanstack/react-form";
import { Button, Paper, PasswordInput, Stack, Text } from "@mantine/core";
import { useProfileMutations } from "../../hooks/useProfileMutations";

interface ChangePasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ChangePasswordForm() {
  const { changePassword } = useProfileMutations();

  const form = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    } as ChangePasswordFormValues,
    // Dùng `mutate` + per-call onSuccess (form.reset) — xem ghi chú ở ProfileInfoForm.
    onSubmit: ({ value }) => {
      changePassword.mutate(
        { currentPassword: value.currentPassword, newPassword: value.newPassword },
        { onSuccess: () => form.reset() },
      );
    },
  });

  return (
    <Paper p="xl" radius="md" className="bg-surface-app border border-border-app max-w-md">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <Stack gap="md">
          <form.Field
            name="currentPassword"
            validators={{
              onChange: ({ value }: { value: string }) =>
                !value ? "Vui lòng nhập mật khẩu hiện tại." : undefined,
            }}
          >
            {(field) => {
              const hasError =
                field.state.meta.isTouched && field.state.meta.errors.length > 0;
              return (
                <PasswordInput
                  label="Mật khẩu hiện tại"
                  placeholder="Nhập mật khẩu hiện tại"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.currentTarget.value)}
                  error={hasError ? field.state.meta.errors[0] : undefined}
                  size="md"
                />
              );
            }}
          </form.Field>

          <form.Field
            name="newPassword"
            validators={{
              onChange: ({ value }: { value: string }) => {
                if (!value) return "Vui lòng nhập mật khẩu mới.";
                if (value.length < 8) return "Mật khẩu mới phải ít nhất 8 ký tự.";
                return undefined;
              },
            }}
          >
            {(field) => {
              const hasError =
                field.state.meta.isTouched && field.state.meta.errors.length > 0;
              return (
                <>
                  <PasswordInput
                    label="Mật khẩu mới"
                    placeholder="Ít nhất 8 ký tự"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.currentTarget.value)}
                    error={hasError ? field.state.meta.errors[0] : undefined}
                    size="md"
                  />
                  <Text size="xs" className="text-text-muted">
                    Tối thiểu 8 ký tự. Không nên trùng mật khẩu đã dùng ở nơi khác.
                  </Text>
                </>
              );
            }}
          </form.Field>

          <form.Field
            name="confirmPassword"
            validators={{
              onChangeListenTo: ["newPassword"],
              onChange: ({ value }: { value: string }) =>
                value !== form.getFieldValue("newPassword")
                  ? "Xác nhận mật khẩu không khớp."
                  : undefined,
            }}
          >
            {(field) => {
              const hasError =
                field.state.meta.isTouched && field.state.meta.errors.length > 0;
              return (
                <PasswordInput
                  label="Xác nhận mật khẩu mới"
                  placeholder="Nhập lại mật khẩu mới"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.currentTarget.value)}
                  error={hasError ? field.state.meta.errors[0] : undefined}
                  size="md"
                />
              );
            }}
          </form.Field>

          <Button type="submit" color="brand" loading={changePassword.isPending}>
            Xác nhận đổi mật khẩu
          </Button>
        </Stack>
      </form>
    </Paper>
  );
}
