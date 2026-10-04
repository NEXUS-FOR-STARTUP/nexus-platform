"use client";

import { useForm } from "@tanstack/react-form";
import { Button, Group, Paper, PasswordInput, Stack, Tooltip } from "@mantine/core";
import { Info } from "lucide-react";
import {
  useHasPasswordQuery,
  useProfileMutations,
} from "../../hooks/useProfileMutations";

interface ChangePasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ChangePasswordForm() {
  const hasPasswordQuery = useHasPasswordQuery();
  const hasPassword = hasPasswordQuery.data === true;
  const { changePassword, setPassword } = useProfileMutations();
  const pending = changePassword.isPending || setPassword.isPending;

  const form = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    } as ChangePasswordFormValues,
    onSubmit: ({ value }) => {
      if (!hasPassword) {
        setPassword.mutate(value.newPassword, { onSuccess: () => form.reset() });
        return;
      }
      changePassword.mutate(
        { currentPassword: value.currentPassword, newPassword: value.newPassword },
        { onSuccess: () => form.reset() },
      );
    },
  });

  if (hasPasswordQuery.isLoading) {
    return (
      <Paper p="xl" radius="md" className="bg-surface-app border border-border-app max-w-md">
        <Button type="button" color="brand" loading>
          Đặt mật khẩu
        </Button>
      </Paper>
    );
  }
  return (
    <Paper p="xl" radius="md" className="bg-surface-app border border-border-app max-w-md">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <Stack gap="lg">
          {hasPassword ? (
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
                    autoComplete="current-password"
                  />
                );
              }}
            </form.Field>
          ) : null}

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
                <PasswordInput
                  label={
                    <Group gap={6} align="center">
                      <span>{hasPassword ? "Mật khẩu mới" : "Mật khẩu"}</span>
                      <Tooltip
                        label="Tối thiểu 8 ký tự. Không nên trùng mật khẩu đã dùng ở nơi khác."
                        withArrow
                        openDelay={200}
                        classNames={{ tooltip: "font-body text-xs" }}
                      >
                        <span className="cursor-help">
                          <Info className="w-3.5 h-3.5 text-text-muted" />
                        </span>
                      </Tooltip>
                    </Group>
                  }
                  placeholder="Ít nhất 8 ký tự"
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
                  label={hasPassword ? "Xác nhận mật khẩu mới" : "Xác nhận mật khẩu"}
                  placeholder="Nhập lại mật khẩu"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.currentTarget.value)}
                  error={hasError ? field.state.meta.errors[0] : undefined}
                  size="md"
                />
              );
            }}
          </form.Field>

          <Button type="submit" color="brand" loading={pending || hasPasswordQuery.isLoading}>
            {hasPassword ? "Xác nhận đổi mật khẩu" : "Đặt mật khẩu"}
          </Button>
        </Stack>
      </form>
    </Paper>
  );
}
