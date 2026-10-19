"use client";

import { useState } from "react";
import { Laptop, DeviceMobile as Smartphone, DeviceTablet as Tablet, Globe, SignOut as LogOut } from "@phosphor-icons/react";
import type { ActiveSessionDto } from "@repo/validation";
import { parseUserAgent, formatIpAddress } from "@/lib/utils/ua-parser";
import classes from "../sessions.module.css";

interface SessionItemProps {
  session: ActiveSessionDto;
  onRevoke: (sessionId: string) => void;
  isRevoking: boolean;
}

function calculateRelativeTime(createdAt: string | Date, nowMs: number, isCurrent: boolean): string {
  if (isCurrent) return "Đang hoạt động";
  const diffMs = nowMs - new Date(createdAt).getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return "Vừa xong";
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} ngày trước`;
}

export function SessionItem({ session, onRevoke, isRevoking }: SessionItemProps) {
  const [mountedTime] = useState(() => Date.now());
  const parsed = parseUserAgent(session.userAgent);
  
  // Dữ liệu thật từ DB: IP thật và thời gian tính từ createdAt
  const formattedIp = formatIpAddress(session.ipAddress);
  const activeTimeText = calculateRelativeTime(session.createdAt, mountedTime, session.isCurrent);

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

  const os = parsed.os;
  const browser = parsed.browser;
  const deviceName = `${browser} trên ${os}`;

  return (
    <div className={`${classes.sessionItem} ${session.isCurrent ? classes.current : ""}`}>
      <div className={classes.sessionInfo}>
        <div className={classes.sessionIcon}>{renderDeviceIcon()}</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span className={classes.deviceName}>{deviceName}</span>
            {session.isCurrent && (
              <span className={classes.currentBadge}>Thiết bị này</span>
            )}
          </div>
          <div className={classes.meta}>
            IP: {formattedIp} · {activeTimeText}
          </div>
        </div>
      </div>

      {/* Cột bên phải khớp 100% Mockup spec.js dòng 53-58: Nếu là phiên hiện tại thì hiện text xanh lá 'Đang hoạt động', ngược lại hiện nút 'Đăng xuất' */}
      <div>
        {session.isCurrent ? (
          <span className={classes.statusRight}>Đang hoạt động</span>
        ) : (
          <button
            type="button"
            className={classes.revokeBtn}
            aria-label={`Đăng xuất khỏi ${deviceName}`}
            disabled={isRevoking}
            onClick={() => onRevoke(session.id)}
          >
            <LogOut size={14} />
            <span>{isRevoking ? "Đang xử lý..." : "Đăng xuất"}</span>
          </button>
        )}
      </div>
    </div>
  );
}
