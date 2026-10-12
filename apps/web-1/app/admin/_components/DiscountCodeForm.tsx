"use client";

import { useState } from "react";
import { Button, Group, NumberInput, Select, TextInput } from "@mantine/core";
import { Plus } from "lucide-react";
import type { CreateDiscountCodeInput } from "@repo/validation";
import type { DiscountServiceType } from "../hooks/useAdminDiscountCodes";

interface DiscountCodeFormProps {
  serviceTypes: DiscountServiceType[];
  isSubmitting: boolean;
  onSubmit: (input: CreateDiscountCodeInput) => void;
}

const FULL_DISCOUNT_PERCENT = 100;

export default function DiscountCodeForm({ serviceTypes, isSubmitting, onSubmit }: DiscountCodeFormProps) {
  const [code, setCode] = useState("");
  const [percentOff, setPercentOff] = useState<number | string>(FULL_DISCOUNT_PERCENT);
  const [serviceTypeId, setServiceTypeId] = useState<string | null>(null);
  const [maxRedemptions, setMaxRedemptions] = useState<number | string>("");
  const [expiresOn, setExpiresOn] = useState("");

  const canSubmit = code.trim().length > 0 && serviceTypeId !== null && typeof percentOff === "number";

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      code,
      percent_off: percentOff,
      service_type_id: serviceTypeId,
      max_redemptions: typeof maxRedemptions === "number" ? maxRedemptions : null,
      expires_at: expiresOn ? new Date(`${expiresOn}T23:59:59`).toISOString() : null,
    });
    setCode("");
    setMaxRedemptions("");
    setExpiresOn("");
  };

  return (
    <Group align="flex-end" gap="sm" wrap="nowrap">
      <TextInput label="Mã" placeholder="VD: TANG4LUOT" value={code} onChange={(e) => setCode(e.currentTarget.value)} />
      <NumberInput label="Giảm (%)" min={1} max={FULL_DISCOUNT_PERCENT} allowDecimal={false} value={percentOff} onChange={setPercentOff} w={110} />
      <Select
        label="Dịch vụ"
        placeholder="Chọn dịch vụ"
        data={serviceTypes.map((t) => ({ value: t.id, label: t.name }))}
        value={serviceTypeId}
        onChange={setServiceTypeId}
      />
      <NumberInput label="Số lượt tối đa" placeholder="Không giới hạn" min={1} allowDecimal={false} value={maxRedemptions} onChange={setMaxRedemptions} w={150} />
      <TextInput label="Hết hạn" type="date" value={expiresOn} onChange={(e) => setExpiresOn(e.currentTarget.value)} />
      <Button leftSection={<Plus size={16} />} onClick={handleSubmit} loading={isSubmitting} disabled={!canSubmit}>
        Tạo mã
      </Button>
    </Group>
  );
}
