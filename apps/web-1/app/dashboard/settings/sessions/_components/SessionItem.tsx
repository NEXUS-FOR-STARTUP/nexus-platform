"use client";

import { Laptop, DeviceMobile as Smartphone, DeviceTablet as Tablet, Globe, SignOut as LogOut } from "@phosphor-icons/react";
import type { ActiveSessionDto } from "@repo/validation";
import { parseUserAgent, formatIpAddress } from "@/lib/utils/ua-parser";
import classes from "../sessions.module.css";

interface SessionItemProps {
  session: ActiveSessionDto;
  onRevoke: (sessionId: string) => void;
  isRevoking: boolean;
}

export function SessionItem({ session, onRevoke, isRevoking }: SessionItemProps) {
  const parsed = parseUserAgent(session.userAgent);
  const formattedIp = formatIpAddress(session.ipAddress);

  const createdAtDate = new Date(session.createdAt);
  const formattedCreatedAt = !isNaN(createdAtDate.getTime())
    ? createdAtDate.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Không xác định";

  const renderDeviceIcon = () => {
    switch (parsed.deviceType) {
      case "desktop":
        return <Laptop size={20} />;
      case "mobile":
        return <Smartphone size={20} />;
      case "tablet":
        return <Tablet size={20} />;
      default:
        return <Globe size={20} />;
    }
  };

  const deviceName = `${parsed.os} • ${parsed.browser}`;

  return (
    <div className={`${classes.sessionItem} ${session.isCurrent ? classes.current : ""}`}>
      <div className={classes.sessionInfo}>
        <div className={classes.sessionIcon}>{renderDeviceIcon()}</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span className={classes.deviceName}>{deviceName}</span>
            {session.isCurrent && (
              <span className={classes.currentBadge}>Đang hoạt động</span>
            )}
          </div>
          <div className={classes.meta}>
            IP: {formattedIp} • Đăng nhập: {formattedCreatedAt}
          </div>
        </div>
      </div>

      {!session.isCurrent && (
        <button
          type="button"
          className={classes.revokeBtn}
          aria-label={`Đăng xuất khỏi ${deviceName}`}
          disabled={isRevoking}
          onClick={() => onRevoke(session.id)}
        >
          <LogOut size={16} />
          <span>{isRevoking ? "Đang xử lý..." : "Đăng xuất"}</span>
        </button>
      )}
    </div>
  );
}
