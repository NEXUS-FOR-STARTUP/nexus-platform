"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";

interface LogoProps {
  className?: string;
  height?: number | string;
}

export default function Logo({ className, height = 52 }: LogoProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Default to light theme logo (Black_Colored.svg) during SSR to prevent layout shift
  const isDark = mounted && theme === "dark";
  const logoSrc = isDark ? "/logo/White_Colored.svg" : "/logo/Black_Colored.svg";

  // When height is 62 (header logo), scale down to 42px on mobile (< md) and retain 62px on desktop
  const isHeaderSize = height === 62;

  return (
    <img
      src={logoSrc}
      alt="Nexus Logo"
      style={isHeaderSize ? undefined : { height }}
      className={
        isHeaderSize
          ? `h-[46px] md:h-[62px] w-auto object-contain ${className ?? ""}`.trim()
          : `w-auto object-contain ${className ?? ""}`.trim()
      }
    />
  );
}

