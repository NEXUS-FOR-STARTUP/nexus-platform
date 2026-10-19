"use client";

import { useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { Button, Paper, Stack } from "@mantine/core";
import { useUpdateProfileName } from "../../hooks/useUpdateProfileName";
import styles from "../profile.module.css";
import { AvatarField } from "./AvatarField";
import { DangerZoneCard } from "./DangerZoneCard";
import { ProfileNameEmailFields } from "./ProfileNameEmailFields";

interface ProfileFormValues {
  name: string;
}

interface ProfileInfoFormProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  refetch: () => Promise<void>;
  hideDangerZone?: boolean;
}

export default function ProfileInfoForm({ user, refetch, hideDangerZone = false }: ProfileInfoFormProps) {
  const updateName = useUpdateProfileName();

  const form = useForm({
    defaultValues: { name: user.name ?? "" } as ProfileFormValues,
    // Dùng `mutate` (fire-and-forget) + per-call onSuccess thay vì `mutateAsync`:
    // TanStack Form v1 re-throw lỗi từ onSubmit, `mutate` tránh unhandled rejection
    // (toast lỗi đã do hook onError lo).
    onSubmit: ({ value }) => {
      updateName.mutate(value.name.trim(), {
        onSuccess: () => {
          // Reset ngay để nút Lưu khoá lại, không chờ refetch session.
          form.reset({ name: value.name.trim() });
          void refetch();
        },
      });
    },
  });

  // Đồng bộ defaultValues từ session khi session được refetch (pattern useIntakeForm).
  useEffect(() => {
    form.reset({ name: user.name ?? "" });
  }, [user.name, form]);

  return (
    <Stack gap="xl">
      <Paper withBorder p="xl" radius="md" className={styles.card}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <Stack gap="lg">
            <h2 className={styles.cardTitle}>Thông tin cơ bản</h2>
            <AvatarField name={user.name} image={user.image} refetch={refetch} />
            <form.Field
              name="name"
              validators={{
                onChange: ({ value }: { value: string }) =>
                  !value.trim() ? "Tên hiển thị không được để trống." : undefined,
              }}
            >
              {(field) => (
                <ProfileNameEmailFields
                  email={user.email}
                  name={{
                    value: field.state.value,
                    onChange: field.handleChange,
                    onBlur: field.handleBlur,
                    error: field.state.meta.isTouched ? field.state.meta.errors[0] : undefined,
                  }}
                />
              )}
            </form.Field>
            {/* So tên đã trim với tên đã lưu: không dùng isDirty (sticky) và không bật nút khi chỉ thêm khoảng trắng. */}
            <form.Subscribe selector={(s) => s.values.name.trim() === (user.name ?? "").trim()}>
              {(unchanged) => (
                <Button
                  type="submit"
                  color="brand"
                  size="sm"
                  className="self-start"
                  disabled={unchanged}
                  loading={updateName.isPending}
                >
                  Lưu thay đổi
                </Button>
              )}
            </form.Subscribe>
          </Stack>
        </form>
      </Paper>

      {!hideDangerZone && <DangerZoneCard />}
    </Stack>
  );
}
