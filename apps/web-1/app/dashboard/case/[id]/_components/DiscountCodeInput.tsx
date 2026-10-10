"use client";

import { useState } from "react";
import { Button, Group, Text, TextInput } from "@mantine/core";
import { Tag, X } from "lucide-react";
import type { DiscountCodeCheckResult } from "@repo/validation";
import { useCheckDiscountCode } from "./use-check-discount-code";

interface DiscountCodeInputProps {
  packageId: string;
  applied: DiscountCodeCheckResult | null;
  onChange: (result: DiscountCodeCheckResult | null) => void;
  disabled?: boolean;
}

export default function DiscountCodeInput({ packageId, applied, onChange, disabled = false }: DiscountCodeInputProps) {
  const [code, setCode] = useState("");
  const { check, isChecking, errorMessage, reset } = useCheckDiscountCode();

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
      <Group justify="space-between" className="text-sm">
        <Group gap="xs">
          <Tag size={16} />
          <Text size="sm" fw={600}>{applied.code}</Text>
          <Text size="sm" c="teal">Giảm {applied.percent_off}%</Text>
        </Group>
        <Button variant="subtle" size="xs" color="gray" leftSection={<X size={14} />} onClick={handleRemove} disabled={disabled}>
          Bỏ mã
        </Button>
      </Group>
    );
  }

  return (
    <div>
      <Group gap="xs" align="flex-start" wrap="nowrap">
        <TextInput
          style={{ flex: 1 }}
          placeholder="Nhập mã giảm giá (nếu có)"
          value={code}
          onChange={(e) => setCode(e.currentTarget.value)}
          error={errorMessage}
          disabled={disabled}
        />
        <Button variant="default" onClick={handleApply} loading={isChecking} disabled={disabled || code.trim().length === 0}>
          Áp dụng
        </Button>
      </Group>
    </div>
  );
}
