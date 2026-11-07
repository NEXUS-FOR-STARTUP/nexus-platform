"use client";

import { useState } from "react";
import { TagIcon } from "@phosphor-icons/react";
import { STAGES, type StageDefinition } from "@app/shared/stages";
import type { MyDiscountCode, MyDiscountCodeStatus } from "@repo/validation";
import { useMyDiscountCodes } from "@/hooks/useMyDiscountCodes";
import { Button } from "../ui/Button";
import ServiceCheckoutModal from "./ServiceCheckoutModal";
import s from "./my-discount-codes.module.css";

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
  if (!codes?.length) return null;

  const stageOf = (c: MyDiscountCode) => STAGES.find((st) => st.serviceType === c.service_type_code);

  return (
    <section className={s.box} aria-label="Mã giảm giá của bạn">
      <h2 className={s.title}>
        <TagIcon size={18} aria-hidden="true" /> Mã giảm giá của bạn
      </h2>
      <ul className={s.list}>
        {codes.map((c) => {
          const stage = stageOf(c);
          return (
            <li key={c.code} className={s.item}>
              <div className={s.info}>
                <b className={c.status === "available" ? s.code : s.codeOff}>{c.code}</b>
                <span className={s.meta}>{`Giảm ${c.percent_off}% · ${stage?.name ?? ""} · dùng 1 lần, cho 1 lượt`}</span>
              </div>
              {c.status === "available" && stage ? (
                <Button onClick={() => setPicked({ stage, code: c.code })}>Dùng mã</Button>
              ) : (
                <span className={s.meta}>{c.status === "available" ? "" : STATUS_LABEL[c.status]}</span>
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
