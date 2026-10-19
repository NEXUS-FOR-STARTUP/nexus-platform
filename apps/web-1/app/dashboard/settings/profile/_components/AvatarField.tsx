"use client";

import { useRef, useState } from "react";
import { Avatar, Button, Group, Loader, Stack } from "@mantine/core";
import { ImagePlus } from "lucide-react";
import { AVATAR_LIMIT_NOTE, getAvatarFileError } from "../../hooks/avatar-limits";
import { useChangeAvatar } from "../../hooks/useChangeAvatar";
import styles from "../profile.module.css";

interface AvatarFieldProps {
  name?: string | null;
  image?: string | null;
  refetch: () => Promise<void>;
}

export function AvatarField({ name, image, refetch }: AvatarFieldProps) {
  const changeAvatar = useChangeAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const error = getAvatarFileError(file);
    setFileError(error);
    if (error) return;
    changeAvatar.mutate(file, { onSuccess: () => void refetch() });
  };

  return (
    <Group align="center" wrap="nowrap">
      <div className="relative">
        <Avatar
          size={96}
          radius="100%"
          src={image ?? undefined}
          className={`${styles.avatar} ${changeAvatar.isPending ? styles.avatarBusy : ""}`}
        >
          {(name || "U").substring(0, 2).toUpperCase()}
        </Avatar>
        {changeAvatar.isPending && (
          <Loader size="sm" className="absolute inset-0 m-auto" aria-label="Đang tải ảnh lên" />
        )}
      </div>
      <Stack gap={6} align="flex-start">
        <Button
          variant="default"
          size="sm"
          leftSection={<ImagePlus className="w-4 h-4" />}
          onClick={() => fileInputRef.current?.click()}
          loading={changeAvatar.isPending}
        >
          Đổi ảnh
        </Button>
        <p className={styles.note}>{AVATAR_LIMIT_NOTE}</p>
        {fileError && (
          <p role="alert" className={styles.avatarError}>
            {fileError}
          </p>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          hidden
          onChange={handleFile}
        />
      </Stack>
    </Group>
  );
}
