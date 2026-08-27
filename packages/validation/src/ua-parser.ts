export interface ParsedUserAgent {
  browser: string;
  os: string;
  deviceType: "desktop" | "mobile" | "tablet" | "unknown";
}

export function parseUserAgent(uaString?: string | null): ParsedUserAgent {
  if (!uaString || typeof uaString !== "string") {
    return {
      browser: "Trình duyệt không xác định",
      os: "Hệ điều hành không xác định",
      deviceType: "unknown",
    };
  }

  const ua = uaString.slice(0, 500); // Guard chống ReDoS

  // 1. Phân tích OS
  let os = "Hệ điều hành khác";
  let deviceType: "desktop" | "mobile" | "tablet" | "unknown" = "desktop";

  if (/Windows NT 10.0/i.test(ua)) os = "Windows 10/11";
  else if (/Windows NT 6.3/i.test(ua)) os = "Windows 8.1";
  else if (/Windows NT 6.1/i.test(ua)) os = "Windows 7";
  else if (/Windows NT/i.test(ua)) os = "Windows";
  else if (/iPad/i.test(ua)) {
    os = "iPadOS";
    deviceType = "tablet";
  } else if (/iPhone|iPod/i.test(ua)) {
    os = "iOS";
    deviceType = "mobile";
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    os = "macOS";
    deviceType = "desktop";
  } else if (/Android/i.test(ua)) {
    os = "Android";
    deviceType = /Mobile/i.test(ua) ? "mobile" : "tablet";
  } else if (/CrOS/i.test(ua)) {
    os = "ChromeOS";
    deviceType = "desktop";
  } else if (/Linux/i.test(ua)) {
    os = "Linux";
    deviceType = "desktop";
  }

  // 2. Phân tích Browser (Thứ tự ưu tiên: Edge -> Opera -> CocCoc -> Brave -> Chrome -> Safari -> Firefox)
  let browser = "Trình duyệt khác";
  if (/Edg\//i.test(ua)) browser = "Microsoft Edge";
  else if (/OPR\/|Opera/i.test(ua)) browser = "Opera";
  else if (/coc_coc/i.test(ua)) browser = "Cốc Cốc";
  else if (/Brave/i.test(ua)) browser = "Brave";
  else if (/Chrome\//i.test(ua)) browser = "Google Chrome";
  else if (/Firefox\//i.test(ua)) browser = "Mozilla Firefox";
  else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = "Apple Safari";

  return { browser, os, deviceType };
}

export function formatIpAddress(ip?: string | null): string {
  if (!ip) return "IP không xác định";
  if (ip === "::1" || ip === "127.0.0.1" || ip.includes("localhost")) {
    return "Localhost";
  }
  return ip.replace(/^::ffff:/, ""); // Bỏ prefix IPv4-mapped IPv6
}
