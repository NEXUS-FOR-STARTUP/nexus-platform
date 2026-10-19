"use client";

import Link from "next/link";
import { ArrowSquareOut, Image as ImageIcon, FileText } from "@phosphor-icons/react";
import { CopyIconButton } from "@/components/ui/CopyIconButton";
import { formatVndAmount } from "@/lib/pricing";
import { getDepositDisplay, depositDetailHref } from "@/lib/deposit-display";
import { getProofUrl } from "@/app/dashboard/payment/hooks/usePayment";
import type { WalletDeposit } from "../hooks/useWallet";
import { formatDateTimeFull } from "./wallet-transaction.types";
import { proofFileName, isPdfProof, toChipTone } from "./wallet-proof";
import styles from "../wallet.module.css";

interface Props {
  deposit: WalletDeposit;
}

export function WalletProofDetail({ deposit }: Props) {
  const display = getDepositDisplay(deposit.status, Boolean(deposit.proof_file_url));
  const tone = toChipTone(display);
  const fileName = proofFileName(deposit.proof_file_url);
  const isPdf = isPdfProof(deposit.proof_file_url);
  const proofUrl = deposit.proof_file_url ? getProofUrl(deposit.proof_file_url) : null;

  const chipClass =
    tone === "ok"
      ? styles.chipGreen
      : tone === "error"
        ? styles.chipRed
        : tone === "draft"
          ? styles.chipBlue
          : tone === "warn"
            ? styles.chipOrange
            : "";

  return (
    <div className={styles.txd}>
      <p className={styles.kvh}>Yêu cầu nạp tiền &amp; Đối soát</p>
      <dl className={styles.kv}>
        <dt>Mã nạp tiền</dt>
        <dd>
          <span className={styles.codeBox}>{deposit.id}</span>
          <CopyIconButton value={deposit.id} label="Sao chép mã nạp tiền" />
        </dd>

        <dt>Số tiền yêu cầu</dt>
        <dd className={styles.amtPlus}>+{formatVndAmount(deposit.amount)}</dd>

        <dt>Nội dung chuyển khoản</dt>
        <dd>
          <span className={styles.codeBox}>{deposit.transfer_content}</span>
          <CopyIconButton value={deposit.transfer_content} label="Sao chép nội dung chuyển khoản" />
        </dd>

        <dt>Trạng thái</dt>
        <dd>
          <span className={`${styles.chip} ${chipClass}`}>{display.label}</span>
          {display.explanation && (
            <span className="text-xs text-text-muted">{display.explanation}</span>
          )}
        </dd>

        <dt>Tệp minh chứng</dt>
        <dd>
          {proofUrl ? (
            <a
              href={proofUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
            >
              {isPdf ? <FileText size={16} /> : <ImageIcon size={16} />}
              <span>{fileName}</span>
              <ArrowSquareOut size={14} />
            </a>
          ) : (
            <span className="text-text-muted">Chưa có tệp minh chứng</span>
          )}
        </dd>

        <dt>Thời gian tạo</dt>
        <dd>{formatDateTimeFull(deposit.created_at)}</dd>

        <dt>Thời gian xác minh</dt>
        <dd>
          {deposit.verified_at
            ? formatDateTimeFull(deposit.verified_at)
            : "Đang chờ xử lý"}
        </dd>
      </dl>

      <div className="mt-4 pt-3 border-t border-border-app">
        <Link
          href={depositDetailHref(deposit.id)}
          className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
        >
          <span>Xem chi tiết nạp tiền &amp; đối soát</span>
          <ArrowSquareOut size={15} />
        </Link>
      </div>
    </div>
  );
}
