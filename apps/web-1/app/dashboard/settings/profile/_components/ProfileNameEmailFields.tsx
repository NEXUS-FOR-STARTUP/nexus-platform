"use client";

import styles from "../profile.module.css";

interface ProfileNameEmailFieldsProps {
  name: {
    value: string;
    error?: string;
    onChange: (value: string) => void;
    onBlur: () => void;
  };
  email?: string | null;
}

export function ProfileNameEmailFields({ name, email }: ProfileNameEmailFieldsProps) {
  return (
    <div>
      <div className={styles.field}>
        <label htmlFor="user-name">
          <span>Tên hiển thị</span>
          <span className={styles.req}>*</span>
        </label>
        <input
          id="user-name"
          type="text"
          placeholder="Nhập tên hiển thị"
          value={name.value}
          onBlur={name.onBlur}
          onChange={(e) => name.onChange(e.target.value)}
          className={`${styles.inputField} ${name.error ? styles.inputErrorBorder : ""}`}
        />
        {name.error && <p className={styles.inputError}>{name.error}</p>}
      </div>

      <div className={styles.field}>
        <label htmlFor="user-email">
          <span>Email đăng nhập</span>
        </label>
        <input
          id="user-email"
          type="email"
          value={email ?? ""}
          disabled
          className={styles.inputField}
        />
        <p className={styles.fieldNote}>Không thể thay đổi</p>
      </div>
    </div>
  );
}
