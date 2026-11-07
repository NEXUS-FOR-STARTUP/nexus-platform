"use client";

import { useState } from "react";
import { TagIcon } from "@phosphor-icons/react";
import { STAGES, type StageDefinition } from "@app/shared/stages";
import type { MyDiscountCode, MyDiscountCodeStatus } from "@repo/validation";
import { useMyDiscountCodes } from "@/hooks/useMyDiscountCodes";
import { useServiceCatalog, filterPackagesByService } from "@/hooks/useServiceCatalog";
import { formatVndAmount } from "@/lib/pricing";
import { Button } from "../ui/Button";
import ServiceCheckoutModal from "./ServiceCheckoutModal";
import s from "./my-discount-codes.module.css";

const PERCENT_DENOMINATOR = 100;
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
  const { data: packages } = useServiceCatalog();
  const [picked, setPicked] = useState<Picked | null>(null);
  if (!codes) return null;
  if (codes.length === 0) {
    return (
      <section className={s.box} aria-label="Mã giảm giá của bạn">
        <h2 className={s.title}>
          <TagIcon size={18} aria-hidden="true" /> Mã giảm giá của bạn
        </h2>
        <span className={s.meta}>Chưa có mã. Sau lần mua đầu tiên ở mỗi giai đoạn, bạn được tặng mã giảm 40% cho lượt tiếp theo.</span>
      </section>
    );
  }

  const stageOf = (c: MyDiscountCode) => STAGES.find((st) => st.serviceType === c.service_type_code);
  const priceLine = (c: MyDiscountCode) => {
    const listPrice = filterPackagesByService(packages, c.service_type_code)[0]?.price;
    if (listPrice === undefined) return "";
    const discounted = Math.round((listPrice * (PERCENT_DENOMINATOR - c.percent_off)) / PERCENT_DENOMINATOR);
    return ` · ${formatVndAmount(listPrice)} → ${formatVndAmount(discounted)}`;
  };
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
          const expiry = c.expires_at && c.status === "available" ? ` · hạn ${DATE_FORMATTER.format(new Date(c.expires_at))}` : "";
          return (
            <li key={c.code} className={s.item}>
              <div className={s.info}>
                <b className={c.status === "available" ? s.code : s.codeOff}>{c.code}</b>
                <span className={s.meta}>{`Giảm ${c.percent_off}% · ${stage?.name ?? ""}${c.status === "available" ? priceLine(c) : ""}${expiry} · dùng 1 lần, cho 1 lượt`}</span>
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
