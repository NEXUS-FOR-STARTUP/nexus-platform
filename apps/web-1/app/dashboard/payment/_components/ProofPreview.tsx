"use client";

import { useState } from "react";
import { Modal, Text } from "@mantine/core";
import { ExternalLink } from "lucide-react";
import { WALLET_COPY } from "@/lib/deposit-display";
import { getProofUrl } from "../hooks/usePayment";

export function ProofPreview({ proofFileUrl }: { proofFileUrl: string }) {
  const [opened, setOpened] = useState(false);
  const [failed, setFailed] = useState(false);
  const proofUrl = getProofUrl(proofFileUrl);
  const isImage = /\.(?:jpe?g|png|webp)(?:[?#].*)?$/i.test(proofFileUrl);

  if (failed) {
    return <Text className="text-base text-text-muted">{WALLET_COPY.proofUnavailable}</Text>;
  }

  if (!isImage) {
    return (
      <a
        href={proofUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-11 items-center gap-2 text-base text-brand hover:underline"
      >
        <ExternalLink className="h-4 w-4" />
        Mở minh chứng
      </a>
    );
  }

  return (
    <>
      <button
        type="button"
        aria-label="Xem ảnh chứng minh kích thước đầy đủ"
        onClick={() => setOpened(true)}
        className="block w-full min-h-11 cursor-pointer text-left"
      >
        <div className="aspect-video max-h-[300px] w-full overflow-hidden rounded-lg border border-border-app bg-surface-app/40">
          <img
            src={proofUrl}
            alt="Ảnh chứng minh chuyển khoản"
            loading="lazy"
            decoding="async"
            width={1200}
            height={675}
            className="h-full w-full object-contain"
            onError={() => setFailed(true)}
          />
        </div>
        <span className="mt-2 inline-block text-base text-brand hover:underline">
          Xem ảnh kích thước đầy đủ
        </span>
      </button>
      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title="Ảnh chứng minh chuyển khoản"
        size="xl"
        centered
        closeButtonProps={{ "aria-label": "Đóng ảnh chứng minh" }}
      >
        <img
          src={proofUrl}
          alt="Ảnh chứng minh chuyển khoản"
          className="h-auto w-full object-contain"
          onError={() => setFailed(true)}
        />
      </Modal>
    </>
  );
}
