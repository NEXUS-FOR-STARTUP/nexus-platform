"use client";

import { useState } from "react";
import { Table, Button, Badge, Text, Paper, Stack } from "@mantine/core";
import { Plus } from "lucide-react";
import { STAGES, type StageDefinition } from "@app/shared/stages";
import type { CreditBalances } from "@/lib/credit-balances";
import { useServiceCatalog, filterPackagesByService } from "@/hooks/useServiceCatalog";
import ServiceCheckoutModal from "./ServiceCheckoutModal";

interface StageBalanceTableProps {
  caseId: string;
  balances?: CreditBalances | null;
}

export default function StageBalanceTable({ caseId, balances }: StageBalanceTableProps) {
  const { data: allPackages } = useServiceCatalog();
  const [selectedStage, setSelectedStage] = useState<StageDefinition | null>(null);

  return (
    <>
      <Paper withBorder radius="md" p="md">
        <Text fw={600} size="sm" mb="sm">Lượt chấm bài theo giai đoạn</Text>
        <Table verticalSpacing="sm" striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Giai đoạn</Table.Th>
              <Table.Th>Số lượt còn lại</Table.Th>
              <Table.Th>Trạng thái dịch vụ</Table.Th>
              <Table.Th style={{ textAlign: "right" }}>Thao tác</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {STAGES.map((stage) => {
              const count = stage.serviceType ? balances?.[stage.serviceType] ?? 0 : 0;
              const hasPackage = stage.serviceType ? filterPackagesByService(allPackages, stage.serviceType).length > 0 : false;
              const canBuy = stage.available && hasPackage;

              return (
                <Table.Tr key={stage.code}>
                  <Table.Td>
                    <Stack gap={2}>
                      <Text size="sm" fw={500}>{stage.name}</Text>
                      <Text size="xs" c="dimmed">Mã nội bộ: {stage.code}</Text>
                    </Stack>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" fw={600} c={count > 0 ? "blue" : "dimmed"}>
                      {count} lượt
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    {stage.available ? (
                      <Badge color="green" variant="light" size="sm">Đang mở</Badge>
                    ) : (
                      <Badge color="gray" variant="light" size="sm">Sắp ra mắt</Badge>
                    )}
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    {canBuy ? (
                      <Button
                        size="sm"
                        variant="light"
                        leftSection={<Plus size={16} />}
                        onClick={() => setSelectedStage(stage)}
                      >
                        Mua thêm
                      </Button>
                    ) : (
                      <Text size="xs" c="dimmed">
                        {stage.available ? "Chưa mở bán" : "Chưa khả dụng"}
                      </Text>
                    )}
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </Paper>

      {selectedStage && selectedStage.serviceType && (
        <ServiceCheckoutModal
          caseId={caseId}
          serviceCode={selectedStage.serviceType}
          stageName={selectedStage.name}
          opened={Boolean(selectedStage)}
          onClose={() => setSelectedStage(null)}
        />
      )}
    </>
  );
}
