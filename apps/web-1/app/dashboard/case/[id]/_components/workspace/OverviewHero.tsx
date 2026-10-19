"use client";

import { Button, Paper, Stack, Text } from "@mantine/core";
import { ArrowRight } from "lucide-react";
import type { NextAction } from "../../hooks/useNextActions";
import s from "./overview.module.css";

interface OverviewHeroProps {
  action: NextAction | null;
  onOpenStage: (slug: string, view: "draft" | "files" | "results") => void;
}

export default function OverviewHero({ action, onOpenStage }: OverviewHeroProps) {
  if (!action) return null;

  return (
    <Paper p="lg" radius="md" withBorder>
      <Stack gap="xs" align="flex-start">
        <h2 className={s.sectionTitle}>{action.title}</h2>
        <Text className={s.body}>{action.description}</Text>
        <Button size="md" rightSection={<ArrowRight size={16} />} onClick={() => onOpenStage(action.stageSlug, action.view)}>
          {action.cta}
        </Button>
      </Stack>
    </Paper>
  );
}
