"use client";

import { useRef, useState } from "react";
import { ImageSquare as ImagePlus, CircleNotch as Loader2 } from "@phosphor-icons/react";
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
    <div className={styles.avatarRow}>
      <div style={{ position: "relative" }}>
        <div className={`${styles.avatar} ${changeAvatar.isPending ? styles.avatarBusy : ""}`}>
          {image ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={image} alt="Avatar" />
          ) : (
            <span>{(name || "U").substring(0, 2).toUpperCase()}</span>
          )}
        </div>
        {changeAvatar.isPending && (
          <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
            <Loader2 size={24} className="animate-spin text-brand" />
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-start" }}>
        <button
          type="button"
          className={styles.avatarBtn}
          onClick={() => fileInputRef.current?.click()}
          disabled={changeAvatar.isPending}
        >
          <ImagePlus size={16} />
          <span>{changeAvatar.isPending ? "Đang tải..." : "Đổi ảnh"}</span>
        </button>
        <span className={styles.note}>{AVATAR_LIMIT_NOTE}</span>
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
      </div>
    </div>
  );
}
