"use client";

import { useEffect, useRef } from "react";
import { useForm } from "@tanstack/react-form";
import { Avatar, Button, Group, Paper, Stack, TextInput, Tooltip } from "@mantine/core";
import { ImagePlus, Info } from "lucide-react";
import { useProfileMutations } from "../../hooks/useProfileMutations";

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
}

export default function ProfileInfoForm({ user, refetch }: ProfileInfoFormProps) {
  const { updateName, changeAvatar } = useProfileMutations();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm({
    defaultValues: { name: user.name ?? "" } as ProfileFormValues,
    // Dùng `mutate` (fire-and-forget) + per-call onSuccess thay vì `mutateAsync`:
    // TanStack Form v1 re-throw lỗi từ onSubmit, `mutate` tránh unhandled rejection
    // (toast lỗi đã do hook onError lo).
    onSubmit: ({ value }) => {
      updateName.mutate(value.name.trim(), {
        onSuccess: () => {
          void refetch();
        },
      });
    },
  });

  // Đồng bộ defaultValues từ session khi session được refetch (pattern useIntakeForm).
  useEffect(() => {
    form.reset({ name: user.name ?? "" });
  }, [user.name, form]);

  const handleChangeAvatar = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    changeAvatar.mutate(file, {
      onSuccess: () => {
        void refetch();
      },
    });
  };

  return (
    <Paper p="xl" radius="md" className="bg-surface-app border border-border-app max-w-md">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <Stack gap="lg">
          <Group align="center">
            <Avatar size={96} radius="100%" src={user.image ?? undefined} color="brand">
              {(user.name || "U").substring(0, 2).toUpperCase()}
            </Avatar>
            <Button
              variant="default"
              leftSection={<ImagePlus className="w-4 h-4" />}
              onClick={handleChangeAvatar}
              loading={changeAvatar.isPending}
              disabled={changeAvatar.isPending}
            >
              Đổi ảnh
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              hidden
              onChange={handleAvatarFile}
            />
          </Group>

          <form.Field
            name="name"
            validators={{
              onChange: ({ value }: { value: string }) =>
                !value.trim() ? "Tên hiển thị không được để trống." : undefined,
            }}
          >
            {(field) => {
              const hasError =
                field.state.meta.isTouched && field.state.meta.errors.length > 0;
              return (
                <TextInput
                  label="Tên hiển thị"
                  placeholder="Nhập tên hiển thị"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.currentTarget.value)}
                  error={hasError ? field.state.meta.errors[0] : undefined}
                  size="md"
                />
              );
            }}
          </form.Field>

          <TextInput
            label={
              <Group gap={6} align="center">
                <span>Email đăng nhập</span>
                <Tooltip
                  label="Email dùng để đăng nhập, không thể thay đổi."
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
            value={user.email ?? ""}
            disabled
            size="md"
          />

          <Button type="submit" color="brand" loading={updateName.isPending}>
            Lưu thay đổi
          </Button>
        </Stack>
      </form>
    </Paper>
  );
}
