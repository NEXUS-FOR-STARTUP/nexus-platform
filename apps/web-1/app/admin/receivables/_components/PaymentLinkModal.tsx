"use client";

import { useState } from "react";
import { Alert, Button, CopyButton, Modal, TextInput } from "@mantine/core";
import { Check, Copy, ArrowSquareOut as ExternalLink, Link as Link2 } from "@phosphor-icons/react";
import type { AdminReceivable } from "@repo/validation";
import { useCreateReceivablePaymentLink } from "../../hooks/useReceivableMutations";
import { formatVnd } from "./format";

interface PaymentLinkModalProps {
  receivable: AdminReceivable;
  onClose: () => void;
}

function CopyRow({ label, value, display }: { label: string; value: string; display?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-base">
      <span className="text-text-muted">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-mono font-semibold">{display ?? value}</span>
        <CopyButton value={value}>
          {({ copied, copy }) => (
            <Button variant="default" size="sm" onClick={copy} aria-label={`Sao chép ${label}`}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          )}
        </CopyButton>
      </div>
    </div>
  );
}

export default function PaymentLinkModal({ receivable, onClose }: PaymentLinkModalProps) {
  const createLink = useCreateReceivablePaymentLink();
  const [confirmingRotate, setConfirmingRotate] = useState(false);
  const payUrl = createLink.data?.pay_url;
  const rotating = receivable.has_payment_link;

  // Link is shown once (only its hash is stored). Open the tab inside the click (async popups get blocked), then point it at the QR page.
  const generate = () => {
    const tab = window.open("about:blank", "_blank");
    if (tab) tab.opener = null;
    createLink.mutate(receivable.id, {
      onSuccess: (data) => {
        if (tab) tab.location.href = data.pay_url;
      },
      onError: () => tab?.close(),
    });
  };

  return (
    <Modal opened onClose={onClose} title={`Gửi khách thanh toán ${receivable.code}`} size="lg" radius="md" centered>
      <div className="space-y-4">
        <CopyRow label="Khách cần chuyển ngay" value={String(receivable.outstanding)} display={formatVnd(receivable.outstanding)} />
        {receivable.outstanding !== receivable.amount_due ? (
          <p className="text-sm text-text-muted">
            Tổng phải thu {formatVnd(receivable.amount_due)} · khách đã trả {formatVnd(receivable.paid)}
            {receivable.written_off > 0 ? ` · bạn đã miễn ${formatVnd(receivable.written_off)}` : ""}
          </p>
        ) : null}
        <CopyRow label="Nội dung chuyển khoản" value={receivable.code} />

        {payUrl ? (
          <div className="space-y-3">
            <Alert color="yellow">
              Link chỉ hiển thị lúc này. Sao chép và gửi cho khách qua Zalo. Nếu mất, hãy tạo link mới.
            </Alert>
            <div className="flex items-end gap-2">
              <TextInput className="flex-1" size="sm" label="Link thanh toán" readOnly value={payUrl} />
              <CopyButton value={payUrl}>
                {({ copied, copy }) => (
                  <Button size="sm" onClick={copy} leftSection={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}>
                    {copied ? "Đã sao chép" : "Sao chép"}
                  </Button>
                )}
              </CopyButton>
            </div>
            <Button component="a" href={payUrl} target="_blank" rel="noopener noreferrer" size="sm" variant="light" leftSection={<ExternalLink className="h-4 w-4" />}>
              Mở trang thanh toán (QR)
            </Button>
            <p className="text-sm text-text-muted">Trang thanh toán đã có sẵn mã QR cho khách quét. Nếu tab mới không mở, bấm nút trên.</p>
          </div>
        ) : confirmingRotate ? (
          <Alert color="red" title="Tạo link mới?">
            Link cũ sẽ ngừng hoạt động ngay. Khách đang giữ link cũ phải dùng link mới.
            <div className="mt-3 flex gap-2">
              <Button color="red" size="sm" loading={createLink.isPending} onClick={generate}>
                Xác nhận tạo link mới
              </Button>
              <Button variant="default" size="sm" onClick={() => setConfirmingRotate(false)}>
                Huỷ
              </Button>
            </div>
          </Alert>
        ) : (
          <Button
            size="sm"
            leftSection={<Link2 className="h-4 w-4" />}
            loading={createLink.isPending}
            onClick={rotating ? () => setConfirmingRotate(true) : generate}
          >
            {rotating ? "Tạo link mới" : "Tạo link & QR gửi khách"}
          </Button>
        )}
      </div>
    </Modal>
  );
}
