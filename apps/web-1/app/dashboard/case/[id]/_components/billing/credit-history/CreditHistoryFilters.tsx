import { Select } from "@mantine/core";
import { CaretDownIcon } from "@phosphor-icons/react";
import FilterTabs from "../../ui/FilterTabs";
import type { CreditDaysFilter, CreditTypeFilter } from "./credit-history-filter";
import s from "./credit-history.module.css";

const TYPE_TABS: ReadonlyArray<{ value: CreditTypeFilter; label: string }> = [
  { value: "all", label: "Tất cả" },
  { value: "purchase", label: "Mua" },
  { value: "consumption", label: "Dùng" },
  { value: "refund", label: "Hoàn" },
];

const DAYS_OPTIONS = [
  { value: "all", label: "Tất cả thời gian" },
  { value: "3", label: "3 ngày qua" },
  { value: "7", label: "7 ngày qua" },
];

interface Props {
  type: CreditTypeFilter;
  days: CreditDaysFilter;
  counts: Record<CreditTypeFilter, number>;
  onTypeChange: (type: CreditTypeFilter) => void;
  onDaysChange: (days: CreditDaysFilter) => void;
}

export default function CreditHistoryFilters({ type, days, counts, onTypeChange, onDaysChange }: Props) {
  return (
    <div className={s.bar}>
      <FilterTabs
        className={s.barTabs}
        ariaLabel="Lọc theo loại"
        value={type}
        onChange={onTypeChange}
        items={TYPE_TABS.map((t) => ({ value: t.value, label: `${t.label} (${counts[t.value]})` }))}
      />
      <Select
        aria-label="Khoảng thời gian"
        data={DAYS_OPTIONS}
        value={days === null ? "all" : String(days)}
        onChange={(v) => onDaysChange(v === null || v === "all" ? null : Number(v))}
        allowDeselect={false}
        checkIconPosition="right"
        rightSection={<CaretDownIcon size={16} aria-hidden />}
        classNames={{ root: s.selectRoot, input: s.select, dropdown: s.selectDropdown, option: s.selectOption }}
      />
    </div>
  );
}
