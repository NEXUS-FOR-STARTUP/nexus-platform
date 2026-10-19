"use client";

import {
  forwardRef,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import Link from "next/link";
import { CircleNotchIcon } from "@phosphor-icons/react";
import classes from "./Button.module.css";

export type ButtonVariant = "primary" | "quiet" | "ghost" | "danger" | "danger-quiet";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leftSection?: ReactNode;
  rightSection?: ReactNode;
  href?: string;
  external?: boolean;
}

const variantClassMap: Record<ButtonVariant, string> = {
  primary: classes.primary,
  quiet: classes.quiet,
  ghost: classes.ghost,
  danger: classes.danger,
  "danger-quiet": classes.dangerQuiet,
};

const sizeClassMap: Record<ButtonSize, string> = {
  sm: classes.sm,
  md: classes.md,
  lg: classes.lg,
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    fullWidth = false,
    disabled = false,
    leftSection,
    rightSection,
    children,
    className = "",
    href,
    external = false,
    type = "button",
    ...props
  },
  ref,
) {
  const isDisabled = disabled || loading;
  const combinedClassName = [
    classes.btn,
    variantClassMap[variant] ?? classes.primary,
    sizeClassMap[size] ?? classes.md,
    fullWidth ? classes.fullWidth : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      {loading ? (
        <CircleNotchIcon size={size === "sm" ? 14 : 16} className={classes.spinner} aria-hidden />
      ) : (
        leftSection
      )}
      {children}
      {!loading && rightSection}
    </>
  );

  if (href && !isDisabled) {
    const linkProps = props as unknown as AnchorHTMLAttributes<HTMLAnchorElement>;
    if (external) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={combinedClassName}
          {...linkProps}
        >
          {content}
        </a>
      );
    }
    return (
      <Link href={href} className={combinedClassName} {...linkProps}>
        {content}
      </Link>
    );
  }

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      className={combinedClassName}
      {...props}
    >
      {content}
    </button>
  );
});

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  {
    label,
    variant = "quiet",
    loading = false,
    disabled = false,
    children,
    className = "",
    type = "button",
    ...props
  },
  ref,
) {
  const isDisabled = disabled || loading;
  const combinedClassName = [classes.ib, className].filter(Boolean).join(" ");

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-label={label}
      title={label}
      className={combinedClassName}
      {...props}
    >
      {loading ? (
        <CircleNotchIcon size={16} className={classes.spinner} aria-hidden />
      ) : (
        children
      )}
    </button>
  );
});
