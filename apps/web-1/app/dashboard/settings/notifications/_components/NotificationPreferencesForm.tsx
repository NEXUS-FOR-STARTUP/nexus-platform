"use client";

import { useState } from "react";
import { useNotificationPreferences } from "../../hooks/useNotificationPreferences";
import classes from "../notifications.module.css";

export default function NotificationPreferencesForm() {
  const { query, save } = useNotificationPreferences();
  const [optimistic, setOptimistic] = useState<boolean | null>(null);
  const enabled = optimistic ?? query.data?.email_enabled;

  if (query.isError) {
    return (
      <p className={classes.note}>
        Không thể tải cài đặt thông báo. Vui lòng thử lại sau.
      </p>
    );
  }

  if (query.isPending || enabled === undefined) {
    return (
      <p className={classes.note}>
        Đang tải cài đặt thông báo...
      </p>
    );
  }

  const handleToggle = () => {
    if (save.isPending) return;
    const nextVal = !enabled;
    setOptimistic(nextVal);
    save.mutate({ email_enabled: nextVal }, { onError: () => setOptimistic(null) });
  };

  return (
    <div className={classes.colNarrow}>
      <div className={classes.card}>
        <div className={classes.cardHead}>
          <div>
            <h2 className={classes.title}>Cài đặt thông báo</h2>
            <p className={classes.note}>Bật hoặc tắt nhận email thông báo từ hệ thống.</p>
          </div>
        </div>

        <div className={classes.notifRow}>
          <div>
            <div className={classes.notifLabel}>Nhận email</div>
            <div className={classes.note}>Gửi thông báo tới email đã đăng ký tài khoản.</div>
          </div>

          {/* Pure HTML Switch matching mockup base.css .switch */}
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            className={`${classes.switch} ${enabled ? classes.switchOn : ""}`}
            onClick={handleToggle}
            disabled={save.isPending}
            aria-label="Bật hoặc tắt nhận email thông báo"
          >
            <span className={classes.thumb} />
          </button>
        </div>
      </div>
    </div>
  );
}
