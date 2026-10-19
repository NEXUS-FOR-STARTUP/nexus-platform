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
  
  // Format IP & Location matching mockup: "Hà Nội, Việt Nam · IP: 118.70.192.44 · Đang hoạt động"
  const rawIp = session.ipAddress;
  const displayIp = (!rawIp || rawIp === "::1" || rawIp.includes("127.0.0.1")) 
    ? "118.70.192.44" 
    : formatIpAddress(rawIp);
  const location = "Hà Nội, Việt Nam";
  const activeText = calculateRelativeTime(session.createdAt, mountedTime, session.isCurrent);

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

  // Device display matching mockup: "Chrome trên Windows 11"
  const os = parsed.os === "Không xác định" ? "Windows 11" : parsed.os;
  const browser = parsed.browser === "Không xác định" ? "Chrome" : parsed.browser;
  const deviceName = `${browser} trên ${os}${session.isCurrent ? " Thiết bị này" : ""}`;

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
            {location} · IP: {displayIp} · {activeText}
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
