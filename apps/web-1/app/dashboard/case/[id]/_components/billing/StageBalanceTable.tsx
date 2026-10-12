"use client";

import { useState } from "react";
import { Table, Button, Badge, Text } from "@mantine/core";
import { Plus } from "lucide-react";
import { STAGES, type StageDefinition } from "@app/shared/stages";
import type { CreditBalances } from "@/lib/credit-balances";
import { useServiceCatalog, filterPackagesByService } from "@/hooks/useServiceCatalog";
import ServiceCheckoutModal from "./ServiceCheckoutModal";
import BillingTableShell, { BILLING_THEAD_CLASS, BILLING_TH_CLASS } from "./BillingTableShell";

interface StageBalanceTableProps {
  caseId: string;
  balances?: CreditBalances | null;
}

function StageBalanceMobileCard({
  stage,
  count,
  canBuy,
  onBuy,
}: {
  stage: StageDefinition;
  count: number;
  canBuy: boolean;
  onBuy: () => void;
}) {
  return (
    <div className="p-3.5 space-y-2.5 bg-surface-app">
      <div className="flex items-center justify-between gap-2">
        <Text size="sm" fw={600}>{stage.name}</Text>
        {stage.available ? (
          <Badge color="green" variant="light" size="sm" radius="xl">Đang mở</Badge>
        ) : (
          <Badge color="gray" variant="light" size="sm" radius="xl">Sắp ra mắt</Badge>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border-app/40">
        <Text size="sm" fw={600} c={count > 0 ? "blue" : "dimmed"} className="tabular-nums">
          {count} lượt
        </Text>
        {canBuy ? (
          <Button
            size="sm"
            variant="light"
            leftSection={<Plus size={14} />}
            onClick={onBuy}
          >
            Mua thêm
          </Button>
        ) : (
          <Text size="xs" c="dimmed">
            {stage.available ? "Chưa mở bán" : "Chưa khả dụng"}
          </Text>
        )}
      </div>
    </div>
  );
}

export default function StageBalanceTable({ caseId, balances }: StageBalanceTableProps) {
  const { data: allPackages } = useServiceCatalog();
  const [selectedStage, setSelectedStage] = useState<StageDefinition | null>(null);

  const rows = STAGES.map((stage) => ({
    stage,
    count: stage.serviceType ? balances?.[stage.serviceType] ?? 0 : 0,
    canBuy: stage.available && (stage.serviceType ? filterPackagesByService(allPackages, stage.serviceType).length > 0 : false),
  }));

  return (
    <>
      <BillingTableShell
        mobile={
          <>
            {rows.map(({ stage, count, canBuy }) => (
              <StageBalanceMobileCard
                key={stage.code}
                stage={stage}
                count={count}
                canBuy={canBuy}
                onBuy={() => setSelectedStage(stage)}
              />
            ))}
          </>
        }
        desktop={
          <Table verticalSpacing="sm" highlightOnHover className="w-full">
            <Table.Thead className={BILLING_THEAD_CLASS}>
              <Table.Tr>
                <Table.Th className={BILLING_TH_CLASS}>Giai đoạn</Table.Th>
                <Table.Th className={BILLING_TH_CLASS}>Số lượt còn lại</Table.Th>
                <Table.Th className={BILLING_TH_CLASS}>Trạng thái dịch vụ</Table.Th>
                <Table.Th className={BILLING_TH_CLASS} style={{ textAlign: "right" }}>Thao tác</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.map(({ stage, count, canBuy }) => (
                <Table.Tr key={stage.code} className="transition-colors hover:bg-surface-soft/60">
                  <Table.Td className="py-3.5">
                    <Text className="text-text-app text-base font-medium leading-tight">{stage.name}</Text>
                  </Table.Td>
                  <Table.Td className="py-3.5">
                    <Text size="sm" fw={600} c={count > 0 ? "blue" : "dimmed"} className="tabular-nums">
                      {count} lượt
                    </Text>
                  </Table.Td>
                  <Table.Td className="py-3.5">
                    {stage.available ? (
                      <Badge color="green" variant="light" size="md" radius="xl">Đang mở</Badge>
                    ) : (
                      <Badge color="gray" variant="light" size="md" radius="xl">Sắp ra mắt</Badge>
                    )}
                  </Table.Td>
                  <Table.Td className="py-3.5" style={{ textAlign: "right" }}>
                    {canBuy ? (
                      <Button size="sm" variant="light" leftSection={<Plus size={16} />} onClick={() => setSelectedStage(stage)}>
                        Mua thêm
                      </Button>
                    ) : (
                      <Text size="xs" c="dimmed">
                        {stage.available ? "Chưa mở bán" : "Chưa khả dụng"}
                      </Text>
                    )}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        }
      />

      {selectedStage && selectedStage.serviceType && (
        <ServiceCheckoutModal
          caseId={caseId}
          serviceCode={selectedStage.serviceType}
          stageName={selectedStage.name}
          opened={selectedStage !== null}
          onClose={() => setSelectedStage(null)}
        />
      )}
    </>
  );
}
