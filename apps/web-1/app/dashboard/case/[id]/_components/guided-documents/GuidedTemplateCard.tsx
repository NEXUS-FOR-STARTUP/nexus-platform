"use client";

import React from "react";
import { Badge, Box, Group, Progress, Stack, Text, UnstyledButton } from "@mantine/core";
import type { Template } from "@repo/validation";
import classes from "./GuidedTemplateCard.module.css";

const MAX_COVER_PHASES = 5;
const PERCENT = 100;
const COVER_BLUR_PX = 0.3;
// Square keeps the screenshot's full width (it is ~1:1) and shows more of its height than a landscape crop.
const THUMB_RATIO = "1 / 1";
const TITLE_LINE_HEIGHT = 1.4;
const TITLE_LINES = 2;
const TITLE_MIN_HEIGHT = `${TITLE_LINE_HEIGHT * TITLE_LINES}em`;

interface GuidedTemplateCardProps {
  template: Template;
  answered: number;
  total: number;
  onOpen: () => void;
  /** Khi true: thẻ mờ đi, có chữ "Coming soon" và không mở được. */
  comingSoon?: boolean;
}

function getStatus(answered: number, total: number) {
  if (answered === 0) return { label: "Chưa bắt đầu", color: "gray" };
  if (answered < total) return { label: "Đang soạn", color: "blue" };
  return { label: "Hoàn thành", color: "teal" };
}

export default function GuidedTemplateCard({
  template,
  answered,
  total,
  onOpen,
  comingSoon = false,
}: GuidedTemplateCardProps) {
  const pct = total > 0 ? Math.round((answered / total) * PERCENT) : 0;
  const status = getStatus(answered, total);

  return (
    <UnstyledButton
      onClick={onOpen}
      disabled={comingSoon}
      className={classes.card}
      style={{ alignSelf: "start" }}
      aria-label={comingSoon ? `Biểu mẫu ${template.title} (Coming soon)` : `Mở biểu mẫu ${template.title}`}
    >
      <Stack gap="sm">
        <Box className={classes.thumb} style={{ aspectRatio: THUMB_RATIO }}>
          {template.cover_image ? (
            // eslint-disable-next-line @next/next/no-img-element -- static public screenshot
            <img
              src={template.cover_image}
              alt=""
              style={{
                display: "block",
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "top",
                filter: `blur(${COVER_BLUR_PX}px)`,
              }}
            />
          ) : (
            <Stack h="100%" gap="xs" p="md">
              {template.phases.slice(0, MAX_COVER_PHASES).map((phase) => (
                <Text key={phase.id} size="sm" c="dimmed" lineClamp={1}>
                  {phase.title}
                </Text>
              ))}
            </Stack>
          )}
          {comingSoon && <span className={classes.comingSoon}>Coming soon</span>}
        </Box>

        <Stack gap={8}>
          <Text size="md" fw={700} lh={TITLE_LINE_HEIGHT} lineClamp={TITLE_LINES} mih={TITLE_MIN_HEIGHT} className={classes.title}>
            {template.title}
          </Text>
          <Progress value={pct} size="sm" radius="xl" color={status.color} />
          <Group gap={8} wrap="nowrap">
            <Badge variant="light" color={status.color}>
              {status.label}
            </Badge>
            <Text size="sm" fw={600}>
              {answered}/{total} câu
            </Text>
          </Group>
        </Stack>
      </Stack>
    </UnstyledButton>
  );
}
