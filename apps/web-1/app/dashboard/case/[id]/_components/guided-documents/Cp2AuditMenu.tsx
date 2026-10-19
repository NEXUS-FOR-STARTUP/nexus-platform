"use client";

import { Button, Popover } from "@mantine/core";
import { ClipboardText as ClipboardCheck } from "@phosphor-icons/react";
import type { Template } from "@repo/validation";
import { useCp2Readiness } from "../../hooks/useCp2Readiness";
import Cp2AuditActions from "./Cp2AuditActions";

const POPOVER_WIDTH = 360;

interface Cp2AuditMenuProps {
  caseId: string;
  template: Template;
  answersMap: Record<string, string>;
}

export default function Cp2AuditMenu({ caseId, template, answersMap }: Cp2AuditMenuProps) {
  const readiness = useCp2Readiness(caseId, template, answersMap);

  return (
    <Popover width={POPOVER_WIDTH} position="bottom-end" withArrow trapFocus>
      <Popover.Target>
        <Button variant="default" size="sm" leftSection={<ClipboardCheck className="w-4 h-4" />}>
          Chấm bài
        </Button>
      </Popover.Target>
      <Popover.Dropdown>
        <Cp2AuditActions caseId={caseId} readiness={readiness} />
      </Popover.Dropdown>
    </Popover>
  );
}
