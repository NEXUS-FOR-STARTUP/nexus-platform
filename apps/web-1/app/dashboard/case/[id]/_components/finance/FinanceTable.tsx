"use client";

import React from "react";
import { ActionIcon, Button, ScrollArea, Table, Text, TextInput } from "@mantine/core";
import { Plus, X } from "lucide-react";
import { FINANCE_MAX_PERIODS, FINANCE_ROWS, type FinanceIssue } from "@repo/validation";
import type { CellTexts, InvalidCell } from "./finance-cells";

interface FinanceTableProps {
  periods: string[];
  texts: CellTexts;
  issues: FinanceIssue[];
  invalid: InvalidCell[];
  onCellChange: (row: string, period: number, text: string) => void;
  onPeriodRename: (period: number, name: string) => void;
  onPeriodRemove: (period: number) => void;
  onPeriodAdd: () => void;
}

const LABEL_WIDTH = 280;
const CELL_WIDTH = 150;

export default function FinanceTable({
  periods,
  texts,
  issues,
  invalid,
  onCellChange,
  onPeriodRename,
  onPeriodRemove,
  onPeriodAdd,
}: FinanceTableProps) {
  const issueAt = (row: string, period: number) =>
    issues.find((i) => i.row === row && i.period === period);
  const isInvalid = (row: string, period: number) =>
    invalid.some((i) => i.row === row && i.period === period);

  return (
    <ScrollArea type="auto">
      <Table withTableBorder withColumnBorders miw={LABEL_WIDTH + CELL_WIDTH * periods.length}>
        <Table.Thead>
          <Table.Tr>
            <Table.Th w={LABEL_WIDTH}>Khoản mục</Table.Th>
            {periods.map((name, period) => (
              <Table.Th key={period} w={CELL_WIDTH}>
                <div className="flex items-center gap-1">
                  <TextInput
                    size="xs"
                    value={name}
                    aria-label={`Tên cột ${period + 1}`}
                    onChange={(e) => onPeriodRename(period, e.currentTarget.value)}
                  />
                  {periods.length > 1 && (
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      size="sm"
                      aria-label={`Xóa cột ${name}`}
                      onClick={() => onPeriodRemove(period)}
                    >
                      <X className="w-3.5 h-3.5" />
                    </ActionIcon>
                  )}
                </div>
              </Table.Th>
            ))}
            <Table.Th w={CELL_WIDTH}>
              <Button
                variant="light"
                size="xs"
                leftSection={<Plus className="w-3.5 h-3.5" />}
                disabled={periods.length >= FINANCE_MAX_PERIODS}
                onClick={onPeriodAdd}
              >
                Thêm cột
              </Button>
            </Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {FINANCE_ROWS.map((row) =>
            row.section ? (
              <Table.Tr key={row.key}>
                <Table.Td colSpan={periods.length + 2} fw={600}>
                  {row.label}
                </Table.Td>
              </Table.Tr>
            ) : (
              <Table.Tr key={row.key}>
                <Table.Td>
                  <Text size="sm" fw={row.kind === "derived" ? 600 : 400}>
                    {row.label}
                  </Text>
                  {row.formula && (
                    <Text size="xs" c="dimmed">
                      {row.formula}
                    </Text>
                  )}
                </Table.Td>
                {periods.map((_, period) => {
                  const issue = issueAt(row.key, period);
                  const bad = isInvalid(row.key, period);
                  return (
                    <Table.Td key={period}>
                      <TextInput
                        size="xs"
                        inputMode="decimal"
                        value={texts[row.key]?.[period] ?? ""}
                        error={
                          bad
                            ? "Không phải số"
                            : issue
                              ? issue.kind === "empty"
                                ? "Còn trống"
                                : "Chưa khớp công thức"
                              : undefined
                        }
                        aria-label={`${row.label}, ${periods[period]}`}
                        onChange={(e) => onCellChange(row.key, period, e.currentTarget.value)}
                      />
                    </Table.Td>
                  );
                })}
                <Table.Td />
              </Table.Tr>
            ),
          )}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  );
}
