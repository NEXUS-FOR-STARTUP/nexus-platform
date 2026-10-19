"use client";

import { useState } from "react";
import { Button, Text } from "@mantine/core";
import { Plus } from "@phosphor-icons/react";
import { STAGES, type StageDefinition } from "@app/shared/stages";
import type { CreditBalances } from "@/lib/credit-balances";
import { useServiceCatalog, filterPackagesByService } from "@/hooks/useServiceCatalog";
import ServiceCheckoutModal from "./ServiceCheckoutModal";
import s from "./credit-history/credit-history.module.css";

interface StageBalanceCardsProps {
  caseId: string;
  balances?: CreditBalances | null;
}

export default function StageBalanceCards({ caseId, balances }: StageBalanceCardsProps) {
  const { data: allPackages } = useServiceCatalog();
  const [selectedStage, setSelectedStage] = useState<StageDefinition | null>(null);

  return (
    <>
      <div className={s.balanceGrid}>
        {STAGES.map((stage) => {
          const count = stage.serviceType ? balances?.[stage.serviceType] ?? 0 : 0;
          const canBuy =
            stage.available && !!stage.serviceType && filterPackagesByService(allPackages, stage.serviceType).length > 0;
          return (
            <div key={stage.code} className={s.balanceCard}>
              <Text fw={500}>{stage.name}</Text>
              <Text fz="var(--ui-text-title)" fw={500} c={count > 0 ? "brand" : "dimmed"} className={s.nums}>
                {`${count} lượt`}
              </Text>
              {canBuy ? (
                <Button variant="light" leftSection={<Plus size={16} />} onClick={() => setSelectedStage(stage)}>
                  Mua thêm
                </Button>
              ) : (
                <Text c="dimmed">{stage.available ? "Chưa mở bán" : "Sẽ mở sau"}</Text>
              )}
            </div>
          );
        })}
      </div>

      {selectedStage?.serviceType && (
        <ServiceCheckoutModal
          caseId={caseId}
          serviceCode={selectedStage.serviceType}
          stageName={selectedStage.name}
          opened
          onClose={() => setSelectedStage(null)}
        />
      )}
    </>
  );
}
