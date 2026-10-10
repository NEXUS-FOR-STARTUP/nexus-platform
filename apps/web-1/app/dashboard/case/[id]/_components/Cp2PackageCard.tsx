"use client";

import { useState } from "react";
import { Button } from "@mantine/core";
import { ShoppingCart } from "lucide-react";
import { formatPrice, PACKAGE_KEYS } from "@/lib/pricing";
import { usePackagePrice } from "@/lib/usePackagePrice";
import CreditQuantityModal from "./CreditQuantityModal";

interface Cp2PackageCardProps {
  caseId: string;
}

/** Thẻ mua gói chấm Checkpoint 2; hiển thị khi nhóm hết lượt CP2. Tự mở modal mua. */
export default function Cp2PackageCard({ caseId }: Cp2PackageCardProps) {
  const [opened, setOpened] = useState(false);
  const { data: pkg } = usePackagePrice(PACKAGE_KEYS.CP2_AUDIT);

  return (
    <div className="bg-surface-app border border-border-app rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-sm text-text-app">{pkg?.name ?? "Gói chấm Checkpoint 2"}</span>
        {pkg && <span className="font-semibold text-sm text-brand tabular-nums">{formatPrice(pkg.price)}</span>}
      </div>
      <p className="text-xs text-text-muted">4 lượt chấm: bảng hỏi phỏng vấn hoặc toàn bộ CP2</p>
      <p className="text-xs text-text-muted">Chưa tới 20,000 VND/lượt</p>
      <Button
        color="brand"
        size="xs"
        leftSection={<ShoppingCart className="w-4 h-4" />}
        onClick={() => setOpened(true)}
        disabled={!pkg}
      >
        Mua gói chấm CP2
      </Button>
      <CreditQuantityModal
        caseId={caseId}
        opened={opened}
        onClose={() => setOpened(false)}
        packageId={PACKAGE_KEYS.CP2_AUDIT}
        isManual
      />
    </div>
  );
}
