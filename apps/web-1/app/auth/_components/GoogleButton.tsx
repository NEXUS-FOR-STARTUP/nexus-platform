"use client";

import { Button, type ButtonProps } from "@mantine/core";
import type { ComponentPropsWithoutRef } from "react";

type GoogleButtonProps = ButtonProps & ComponentPropsWithoutRef<"button">;

export function GoogleButton({ children, fullWidth = true, ...props }: GoogleButtonProps) {
  return (
    <Button
      fullWidth={fullWidth}
      leftSection={
        <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden>
          <path
            fill="#EA4335"
            d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
          />
          <path
            fill="#4285F4"
            d="M46.5 24c0-1.61-.15-3.16-.42-4.69H24v8.89h12.66c-.55 2.92-2.2 5.39-4.69 7.06l7.29 5.65C43.62 36.2 46.5 30.65 46.5 24z"
          />
          <path
            fill="#FBBC05"
            d="M10.54 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.98-6.19z"
          />
          <path
            fill="#34A853"
            d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.29-5.65c-2.03 1.37-4.63 2.19-8.6 2.19-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
          />
        </svg>
      }
      variant="default"
      radius="md"
      size="md"
      className="h-10 cursor-pointer font-medium border-border-app hover:bg-surface-soft transition-colors"
      {...props}
    >
      {children}
    </Button>
  );
}

