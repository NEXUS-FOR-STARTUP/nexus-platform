"use client";

import { NumberInput, Select } from "@mantine/core";
import { RECEIVABLE_MAX_QUANTITY } from "@repo/validation";
import { filterPackagesByService, useServiceCatalog, type ServicePackageDto } from "@/hooks/useServiceCatalog";
import { formatVnd, safeLabel } from "./format";

export interface PurchaseDraft {
  package_id: string;
  quantity: number;
}

export function packageLabel(pkg: ServicePackageDto): string {
  const name = safeLabel(pkg.service_type?.name ?? pkg.name);
  return `${name} · ${formatVnd(pkg.price)} · ${pkg.credits_granted ?? 0} lượt`;
}

interface PurchaseFieldsProps {
  draft: PurchaseDraft;
  onChange: (next: PurchaseDraft) => void;
}

export default function PurchaseFields({ draft, onChange }: PurchaseFieldsProps) {
  const catalog = useServiceCatalog();

  const packages = [
    ...filterPackagesByService(catalog.data, "cp1_audit"),
    ...filterPackagesByService(catalog.data, "cp2_audit"),
  ];
  const selectedPkg = packages.find((p) => p.id === draft.package_id);

  return (
    <div className="space-y-4 rounded-xl border border-border-app p-4">
      <Select
        label="Gói bạn ứng cho khách"
        size="sm"
        placeholder="Chọn gói đang bán"
        allowDeselect={false}
        data={packages.map((p) => ({ value: p.id, label: packageLabel(p) }))}
        value={draft.package_id || null}
        onChange={(v) => v && onChange({ ...draft, package_id: v })}
      />
      <NumberInput
        label="Số lượng gói"
        size="sm"
        min={1}
        max={RECEIVABLE_MAX_QUANTITY}
        allowDecimal={false}
        allowNegative={false}
        value={draft.quantity}
        onChange={(v) => onChange({ ...draft, quantity: typeof v === "number" ? v : 1 })}
      />
      {selectedPkg ? (
        <p className="text-sm text-text-muted">
          Bạn ứng {formatVnd(selectedPkg.price)} · Khách nhận {(selectedPkg.credits_granted ?? 0) * draft.quantity} lượt · Khách phải trả{" "}
          {formatVnd(selectedPkg.price * draft.quantity)}
        </p>
      ) : null}
    </div>
  );
}
