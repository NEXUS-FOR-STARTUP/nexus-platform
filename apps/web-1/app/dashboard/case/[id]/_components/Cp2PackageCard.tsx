"use client";

import { useState } from "react";
import { formatPrice, PACKAGE_KEYS } from "@/lib/pricing";
import { usePackagePrice } from "@/lib/usePackagePrice";
import RainbowBuyButton from "@/components/ui/RainbowBuyButton";
import CreditQuantityModal from "./CreditQuantityModal";
interface Cp2PackageCardProps {
  caseId: string;
}

/** Thẻ mua gói chấm vòng Thị trường; hiển thị khi nhóm hết lượt. Tự mở modal mua. */
export default function Cp2PackageCard({ caseId }: Cp2PackageCardProps) {
  const [opened, setOpened] = useState(false);
  const { data: pkg } = usePackagePrice(PACKAGE_KEYS.CP2_AUDIT);

  return (
    <div className="bg-surface-app border border-border-app rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-sm text-text-app">{pkg?.name ?? "Gói chấm vòng Thị trường"}</span>
        {pkg && <span className="font-semibold text-sm text-brand tabular-nums">{formatPrice(pkg.price)}</span>}
      </div>
      <p className="text-xs text-text-muted">2 lượt chấm: bảng hỏi phỏng vấn hoặc chấm toàn bộ vòng Thị trường</p>
      <p className="text-xs text-text-muted">Chưa tới 40,000 VND/lượt</p>
      <RainbowBuyButton fullWidth size="lg" disabled={!pkg} onClick={() => setOpened(true)}>
        Mua gói chấm vòng Thị trường
      </RainbowBuyButton>
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
