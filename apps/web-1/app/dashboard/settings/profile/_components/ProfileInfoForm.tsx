"use client";

import { useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { Button, Paper } from "@mantine/core";
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

export default function ProfileInfoForm({
  user,
  refetch,
  hideDangerZone = false,
}: ProfileInfoFormProps) {
  const updateName = useUpdateProfileName();

  const form = useForm({
    defaultValues: { name: user.name ?? "" } as ProfileFormValues,
    onSubmit: ({ value }) => {
      updateName.mutate(value.name.trim(), {
        onSuccess: () => {
          form.reset({ name: value.name.trim() });
          void refetch();
        },
      });
    },
  });

  useEffect(() => {
    form.reset({ name: user.name ?? "" });
  }, [user.name, form]);

  return (
    <div className="flex flex-col gap-8 max-w-[560px]">
      <Paper withBorder className={styles.card}>
        <h2 className={styles.cardTitle}>Thông tin cơ bản</h2>
        <p className={styles.cardSubtitle}>
          Thông tin hiển thị trên hệ thống và trong các báo cáo phản biện.
        </p>

        <AvatarField
          name={user.name}
          image={user.image}
          refetch={refetch}
        />

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void form.handleSubmit();
          }}
          noValidate
        >
          <form.Field
            name="name"
            validators={{
              onChange: ({ value }) =>
                !value.trim() ? "Tên hiển thị không được để trống." : undefined,
            }}
          >
            {(field) => (
              <ProfileNameEmailFields
                name={{
                  value: field.state.value,
                  error: field.state.meta.errors[0],
                  onChange: field.handleChange,
                  onBlur: field.handleBlur,
                }}
                email={user.email}
              />
            )}
          </form.Field>

          <div className={styles.formActions}>
            <form.Subscribe
              selector={(s) =>
                s.values.name.trim() === (user.name ?? "").trim()
              }
            >
              {(unchanged) => (
                <Button
                  type="submit"
                  className={styles.saveBtn}
                  disabled={unchanged || updateName.isPending}
                  loading={updateName.isPending}
                >
                  Lưu thay đổi
                </Button>
              )}
            </form.Subscribe>
          </div>
        </form>
      </Paper>

      {!hideDangerZone && <DangerZoneCard />}
    </div>
  );
}
