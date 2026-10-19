"use client";

import { ActionIcon, Menu } from "@mantine/core";
import { Download, Ellipsis, RefreshCw } from "lucide-react";
import type { TemplateKey } from "@repo/validation";
import { useGuidedDocuments } from "../../../hooks/useGuidedDocuments";

interface StageActionsMenuProps {
  caseId: string;
  templateKey: TemplateKey;
  /** Unsaved draft question ids, so sync never overwrites what the user is typing. */
  draftQuestionIds: string[];
}

export default function StageActionsMenu({ caseId, templateKey, draftQuestionIds }: StageActionsMenuProps) {
  const { syncAnswers, generateDocx, isSyncing, isGenerating } = useGuidedDocuments(caseId, templateKey);

  return (
    <Menu position="bottom-end" withinPortal>
      <Menu.Target>
        <ActionIcon variant="default" size="lg" aria-label="Thêm">
          <Ellipsis size={18} />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item
          leftSection={<RefreshCw size={16} />}
          disabled={isSyncing}
          onClick={() => syncAnswers(draftQuestionIds)}
        >
          Đồng bộ thông tin
        </Menu.Item>
        <Menu.Item
          leftSection={<Download size={16} />}
          disabled={isGenerating}
          onClick={() => generateDocx()}
        >
          Xuất file DOCX
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
