"use client";

import { useState } from "react";
import { STAGES, type StageDefinition } from "@app/shared/stages";
import type { CreditBalances } from "@/lib/credit-balances";
import { useServiceCatalog, filterPackagesByService } from "@/hooks/useServiceCatalog";
import { Button } from "../ui/Button";
import ServiceCheckoutModal from "./ServiceCheckoutModal";
import s from "./credit-history/credit-history.module.css";

const COUNT_WORDS: Record<number, string> = { 1: "Một", 2: "Hai", 3: "Ba" };

interface StageBalanceCardsProps {
  caseId: string;
  balances?: CreditBalances | null;
}

export default function StageBalanceCards({ caseId, balances }: StageBalanceCardsProps) {
  const { data: allPackages } = useServiceCatalog();
  const [selectedStage, setSelectedStage] = useState<StageDefinition | null>(null);
  const openStages = STAGES.filter((stage) => stage.serviceType);
  const ungradedCount = STAGES.length - openStages.length;

  return (
    <div>
      <div className={s.bal}>
        {openStages.map((stage) => {
          const count = stage.serviceType ? balances?.[stage.serviceType] ?? 0 : 0;
          const canBuy = !!stage.serviceType && filterPackagesByService(allPackages, stage.serviceType).length > 0;
          return (
            <div key={stage.code} className={s.balCard}>
              <div>
                <p className={`${s.note} ${s.balName}`}>{stage.name}</p>
                <p className={s.big}>{`${count} lượt`}</p>
              </div>
              {canBuy ? (
                <Button onClick={() => setSelectedStage(stage)}>Mua thêm</Button>
              ) : (
                <span className={s.note}>Chưa mở bán</span>
              )}
            </div>
          );
        })}
      </div>
      {ungradedCount > 0 && (
        <p className={`${s.note} ${s.balNote}`}>
          {`${COUNT_WORDS[ungradedCount] ?? ungradedCount} giai đoạn sau chưa có dịch vụ chấm.`}
        </p>
      )}

      {selectedStage?.serviceType && (
        <ServiceCheckoutModal
          caseId={caseId}
          serviceCode={selectedStage.serviceType}
          stageName={selectedStage.name}
          opened
          onClose={() => setSelectedStage(null)}
        />
      )}
    </div>
  );
}
