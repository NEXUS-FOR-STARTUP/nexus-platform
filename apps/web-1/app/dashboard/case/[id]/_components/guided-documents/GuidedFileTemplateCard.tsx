"use client";

import React from "react";
import { Badge, Box, Center, Stack, Text, UnstyledButton } from "@mantine/core";
import { FileSpreadsheet } from "lucide-react";
import type { FileTemplate } from "@repo/validation";
import classes from "./GuidedTemplateCard.module.css";

const THUMB_RATIO = "1 / 1";
const ICON_SIZE = 56;
const TITLE_LINE_HEIGHT = 1.4;
const TITLE_LINES = 2;
const TITLE_MIN_HEIGHT = `${TITLE_LINE_HEIGHT * TITLE_LINES}em`;

interface GuidedFileTemplateCardProps {
  template: FileTemplate;
  onOpen: () => void;
}

export default function GuidedFileTemplateCard({ template, onOpen }: GuidedFileTemplateCardProps) {
  return (
    <UnstyledButton
      onClick={onOpen}
      className={classes.card}
      style={{ alignSelf: "start" }}
      aria-label={`Mở file mẫu ${template.title}`}
    >
      <Stack gap="sm">
        <Box className={classes.thumb} style={{ aspectRatio: THUMB_RATIO }}>
          <Center h="100%">
            <FileSpreadsheet size={ICON_SIZE} strokeWidth={1.25} />
          </Center>
        </Box>
        <Stack gap={8}>
          <Text size="md" fw={700} lh={TITLE_LINE_HEIGHT} lineClamp={TITLE_LINES} mih={TITLE_MIN_HEIGHT} className={classes.title}>
            {template.title}
          </Text>
          <Badge variant="light" color="gray" w="fit-content">
            File mẫu
          </Badge>
        </Stack>
      </Stack>
    </UnstyledButton>
  );
}
