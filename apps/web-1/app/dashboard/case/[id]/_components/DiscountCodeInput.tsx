"use client";

import { useId, useState } from "react";
import { TagIcon, XIcon } from "@phosphor-icons/react";
import type { DiscountCodeCheckResult } from "@repo/validation";
import { Button } from "./ui/Button";
import { useCheckDiscountCode } from "./use-check-discount-code";
import s from "./discount-code.module.css";

interface DiscountCodeInputProps {
  packageId: string;
  applied: DiscountCodeCheckResult | null;
  onChange: (result: DiscountCodeCheckResult | null) => void;
  disabled?: boolean;
}

export default function DiscountCodeInput({ packageId, applied, onChange, disabled = false }: DiscountCodeInputProps) {
  const [code, setCode] = useState("");
  const { check, isChecking, errorMessage, reset } = useCheckDiscountCode();
  const errorId = useId();

  const handleApply = () => {
    check({ code, packageId }, { onSuccess: onChange });
  };

  const handleRemove = () => {
    reset();
    setCode("");
    onChange(null);
  };

  if (applied) {
    return (
      <div className={s.applied}>
        <span className={s.tag}>
          <TagIcon size={18} aria-hidden="true" />
          <b>{applied.code}</b>
          <span className={s.off}>Giảm {applied.percent_off}%</span>
        </span>
        <Button variant="quiet" size="sm" leftSection={<XIcon size={14} aria-hidden="true" />} onClick={handleRemove} disabled={disabled}>
          Bỏ mã
        </Button>
      </div>
    );
  }

  const canApply = !disabled && code.trim().length > 0;

  return (
    <form
      className={s.row}
      onSubmit={(e) => {
        e.preventDefault();
        if (canApply && !isChecking) handleApply();
      }}
    >
      <div className={s.field}>
        <input
          className={`${s.input} ${errorMessage ? s.invalid : ""}`}
          type="text"
          placeholder="Nhập mã giảm giá (nếu có)"
          aria-label="Mã giảm giá"
          aria-invalid={errorMessage ? true : undefined}
          aria-describedby={errorMessage ? errorId : undefined}
          value={code}
          onChange={(e) => setCode(e.currentTarget.value)}
          disabled={disabled}
        />
        {errorMessage && (
          <p id={errorId} className={s.error} role="alert">
            {errorMessage}
          </p>
        )}
      </div>
      <Button type="submit" variant="quiet" loading={isChecking} disabled={!canApply}>
        Áp dụng
      </Button>
    </form>
  );
}
