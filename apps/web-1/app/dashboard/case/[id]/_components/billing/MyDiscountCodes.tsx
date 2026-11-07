"use client";

import { useState } from "react";
import { TagIcon } from "@phosphor-icons/react";
import { STAGES, type StageDefinition } from "@app/shared/stages";
import type { MyDiscountCode, MyDiscountCodeStatus } from "@repo/validation";
import { useMyDiscountCodes } from "@/hooks/useMyDiscountCodes";
import { Button } from "../ui/Button";
import ServiceCheckoutModal from "./ServiceCheckoutModal";
import s from "./my-discount-codes.module.css";

const DATE_FORMATTER = new Intl.DateTimeFormat("vi-VN");

const STATUS_LABEL: Record<Exclude<MyDiscountCodeStatus, "available">, string> = {
  used: "Đã dùng",
  expired: "Hết hạn",
};

interface Picked {
  stage: StageDefinition;
  code: string;
}

export default function MyDiscountCodes({ caseId }: { caseId: string }) {
  const { data: codes } = useMyDiscountCodes(caseId);
  const [picked, setPicked] = useState<Picked | null>(null);
  if (!codes) return null;
  if (codes.length === 0) {
    return (
      <section className={s.box} aria-label="Mã giảm giá của bạn">
        <h2 className={s.title}>
          <TagIcon size={18} aria-hidden="true" /> Mã giảm giá của bạn
        </h2>
        <span className={s.meta}>Chưa có mã. Sau lần mua đầu tiên ở mỗi giai đoạn, bạn được tặng mã giảm giá cho lượt tiếp theo.</span>
      </section>
    );
  }

  const stageOf = (c: MyDiscountCode) => STAGES.find((st) => st.serviceType === c.service_type_code);
  // Available codes first so the actionable ones are never buried under used/expired history.
  const sorted = [...codes].sort((a, b) => Number(b.status === "available") - Number(a.status === "available"));

  return (
    <section className={s.box} aria-label="Mã giảm giá của bạn">
      <h2 className={s.title}>
        <TagIcon size={18} aria-hidden="true" /> Mã giảm giá của bạn
      </h2>
      <ul className={s.list}>
        {sorted.map((c) => {
          const stage = stageOf(c);
          const expiry = c.expires_at && c.status === "available" ? `, hạn đến ${DATE_FORMATTER.format(new Date(c.expires_at))}` : "";
          return (
            <li key={c.code} className={s.item}>
              <div className={s.info}>
                <b className={c.status === "available" ? s.code : s.codeOff}>{c.code}</b>
                <span className={s.meta}>{`Giảm ${c.percent_off}% cho gói chấm ${stage?.name ?? ""}, dùng được 1 lần${expiry}`}</span>
              </div>
              {c.status === "available" ? (
                stage && <Button onClick={() => setPicked({ stage, code: c.code })}>Dùng mã</Button>
              ) : (
                <span className={s.meta}>{STATUS_LABEL[c.status]}</span>
              )}
            </li>
          );
        })}
      </ul>
      {picked?.stage.serviceType && (
        <ServiceCheckoutModal
          caseId={caseId}
          serviceCode={picked.stage.serviceType}
          stageName={picked.stage.name}
          initialCode={picked.code}
          opened
          onClose={() => setPicked(null)}
        />
      )}
    </section>
  );
}
