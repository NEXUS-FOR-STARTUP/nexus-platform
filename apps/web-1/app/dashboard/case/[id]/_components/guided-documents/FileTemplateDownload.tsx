"use client";

import React from "react";
import { Blockquote, Button, Spoiler } from "@mantine/core";
import { DownloadSimple as Download } from "@phosphor-icons/react";
import type { FileTemplate } from "@repo/validation";

const INSTRUCTIONS_COLLAPSED_HEIGHT_PX = 120;

/** Download button + lecturer instructions for a downloadable file template (xlsx). */
export default function FileTemplateDownload({ template }: { template: FileTemplate }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <Button
          component="a"
          href={template.file_url}
          download={template.file_name}
          leftSection={<Download className="w-4 h-4" />}
        >
          Tải {template.file_name}
        </Button>
      </div>

      <Blockquote color="blue" radius="md" p="md" style={{ whiteSpace: "pre-line" }}>
        <Spoiler maxHeight={INSTRUCTIONS_COLLAPSED_HEIGHT_PX} showLabel="Xem đầy đủ hướng dẫn" hideLabel="Thu gọn">
          {template.instructions}
        </Spoiler>
      </Blockquote>
    </div>
  );
}
