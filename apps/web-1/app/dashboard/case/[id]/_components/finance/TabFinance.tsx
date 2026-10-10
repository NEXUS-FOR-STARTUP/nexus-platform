"use client";

import React, { useState } from "react";
import { Alert, Button, Loader, Text, Textarea, TextInput } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { CheckCircle2, Info, Save } from "lucide-react";
import {
  FINANCE_MAX_PERIODS,
  checkFinancePlan,
  emptyFinancePlan,
  type FinanceIssue,
  type FinancePlan,
} from "@repo/validation";
import { useFinancePlan } from "../../hooks/useFinancePlan";
import FinanceTable from "./FinanceTable";
import { defaultPeriods, toPlan, toTexts, type CellTexts, type InvalidCell } from "./finance-cells";

interface FinanceEditorProps {
  initial: FinancePlan;
  isSaving: boolean;
  onSave: (plan: FinancePlan) => Promise<void>;
}

function FinanceEditor({ initial, isSaving, onSave }: FinanceEditorProps) {
  const [unit, setUnit] = useState(initial.unit);
  const [periods, setPeriods] = useState(initial.periods);
  const [texts, setTexts] = useState<CellTexts>(() => toTexts(initial));
  const [notes, setNotes] = useState(initial.notes);
  const [issues, setIssues] = useState<FinanceIssue[] | null>(null);
  const [invalid, setInvalid] = useState<InvalidCell[]>([]);

  // Any edit makes a previous check result stale.
  const touched = () => {
    setIssues(null);
    setInvalid([]);
  };

  const build = (): FinancePlan | null => {
    const result = toPlan(unit, periods, texts, notes);
    if ("invalid" in result) {
      setInvalid(result.invalid);
      notifications.show({
        title: "Có ô không phải số",
        message: "Sửa các ô báo đỏ rồi thử lại.",
        color: "red",
      });
      return null;
    }
    return result.plan;
  };

  const handleCheck = () => {
    const plan = build();
    if (!plan) return;
    setInvalid([]);
    setIssues(checkFinancePlan(plan));
  };

  const handleSave = async () => {
    const plan = build();
    if (plan) await onSave(plan);
  };

  const addPeriod = () => {
    touched();
    setPeriods((p) => [...p, `Kỳ ${p.length + 1}`]);
    setTexts((t) => Object.fromEntries(Object.entries(t).map(([k, cells]) => [k, [...cells, ""]])));
  };

  const removePeriod = (index: number) => {
    touched();
    setPeriods((p) => p.filter((_, i) => i !== index));
    setTexts((t) =>
      Object.fromEntries(Object.entries(t).map(([k, cells]) => [k, cells.filter((_, i) => i !== index)])),
    );
  };

  return (
    <div className="space-y-4">
      <Alert variant="light" color="blue" icon={<Info className="w-4 h-4" />}>
        Bạn tự điền toàn bộ số, kể cả các dòng tổng và biên lợi nhuận theo công thức ghi dưới tên dòng. Nút Kiểm tra chỉ
        báo ô nào chưa khớp công thức, không cho biết số đúng và không đánh giá số liệu có hợp lý với thực tế hay không.
        Hoàn tiền nhập là số âm; phần giả định và công sức không trả lương (sweat equity) ghi ở ô ghi chú bên dưới.
      </Alert>

      <div className="flex flex-wrap items-end gap-3">
        <TextInput
          label="Đơn vị tiền"
          size="sm"
          w={140}
          maxLength={40}
          value={unit}
          onChange={(e) => {
            touched();
            setUnit(e.currentTarget.value);
          }}
        />
        <Text size="xs" c="dimmed">
          Tối đa {FINANCE_MAX_PERIODS} cột. Tên cột tự đặt: tháng, quý, học kỳ hoặc năm.
        </Text>
      </div>

      <FinanceTable
        periods={periods}
        texts={texts}
        issues={issues ?? []}
        invalid={invalid}
        onCellChange={(row, period, text) => {
          touched();
          setTexts((t) => ({ ...t, [row]: t[row].map((c, i) => (i === period ? text : c)) }));
        }}
        onPeriodRename={(period, name) => {
          touched();
          setPeriods((p) => p.map((n, i) => (i === period ? name : n)));
        }}
        onPeriodRemove={removePeriod}
        onPeriodAdd={addPeriod}
      />

      <Textarea
        label="Ghi chú giả định"
        description="Căn cứ của doanh thu, chi phí, vay vốn; công sức thành viên không trả lương."
        autosize
        minRows={3}
        maxLength={5000}
        value={notes}
        onChange={(e) => {
          touched();
          setNotes(e.currentTarget.value);
        }}
      />

      {issues !== null &&
        (issues.length === 0 ? (
          <Alert color="teal" icon={<CheckCircle2 className="w-4 h-4" />}>
            Không có ô nào lệch công thức.
          </Alert>
        ) : (
          <Alert color="orange" icon={<Info className="w-4 h-4" />}>
            {issues.length} ô chưa khớp công thức hoặc còn trống, xem các ô báo đỏ. Một ô sai ở trên có thể kéo theo các ô
            tính từ nó ở bên dưới.
          </Alert>
        ))}

      <div className="flex gap-2">
        <Button variant="default" onClick={handleCheck}>
          Kiểm tra
        </Button>
        <Button loading={isSaving} leftSection={<Save className="w-4 h-4" />} onClick={handleSave}>
          Lưu
        </Button>
      </div>
    </div>
  );
}

export default function TabFinance({ caseId }: { caseId: string }) {
  const { plan, isLoading, isSaving, savePlan } = useFinancePlan(caseId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader size="sm" />
      </div>
    );
  }

  const initial: FinancePlan = plan ?? emptyFinancePlan(defaultPeriods());
  return <FinanceEditor initial={initial} isSaving={isSaving} onSave={savePlan} />;
}
