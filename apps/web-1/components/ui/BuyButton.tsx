"use client";

import { Button, type MantineSize } from "@mantine/core";

interface BuyButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  size?: MantineSize | `compact-${MantineSize}` | string;
  fullWidth?: boolean;
  className?: string;
}

/**
 * Flat landing orange (--color-accent-warm) for the stage header purchase CTA, the only solid
 * orange control there, so it stays distinct from the amber alert banners.
 * White text matches the landing CTA. Contrast on #F97316 is ~2.8:1 and fails AA at this size
 * (bold does not exempt it); a darker orange such as #C2410C would pass.
 */
export default function BuyButton({ children, ...props }: BuyButtonProps) {
  return (
    <Button
      {...props}
      style={{
        "--button-bg": "var(--color-accent-warm)",
        "--button-hover": "var(--color-accent-warm-hover)",
        "--button-color": "var(--mantine-color-white)",
        fontWeight: 700,
      }}
    >
      {children}
    </Button>
  );
}
