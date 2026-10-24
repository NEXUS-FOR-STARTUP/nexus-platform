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
        <span className="font-semibold text-sm text-text-app">{pkg?.name}</span>
        {pkg && <span className="font-semibold text-sm text-brand tabular-nums">{formatPrice(pkg.price)}</span>}
      </div>
      {pkg?.credits_granted ? (
        <>
          <p className="text-xs text-text-muted">{`${pkg.credits_granted} lượt chấm: bảng hỏi phỏng vấn hoặc chấm toàn bộ vòng Thị trường`}</p>
          <p className="text-xs text-text-muted">{`${formatPrice(Math.floor(pkg.price / pkg.credits_granted))}/lượt`}</p>
        </>
      ) : null}
      <RainbowBuyButton fullWidth size="lg" disabled={!pkg} onClick={() => setOpened(true)}>
        {pkg ? `Mua ${pkg.name}` : "Mua gói"}
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
