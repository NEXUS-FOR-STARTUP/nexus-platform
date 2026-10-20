"use client";

import { formatVndAmount } from "@/lib/pricing";
import { TOPUP_PRESET_AMOUNTS } from "./wallet-topup.constants";
import styles from "../wallet.module.css";

interface Props {
  selectedAmount: number;
  onSelect: (amount: number) => void;
}

export function TopupPresetButtons({ selectedAmount, onSelect }: Props) {
  return (
    <div className={styles.presetGrid}>
      {TOPUP_PRESET_AMOUNTS.map((preset) => {
        const isSelected = selectedAmount === preset;
        return (
          <button
            key={preset}
            type="button"
            className={`${styles.presetBtn} ${isSelected ? styles.presetBtnActive : ""}`}
            onClick={() => onSelect(preset)}
            aria-pressed={isSelected}
          >
            {formatVndAmount(preset)}
          </button>
        );
      })}
    </div>
  );
}
