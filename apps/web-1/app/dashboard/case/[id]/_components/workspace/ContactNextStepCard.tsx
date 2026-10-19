"use client";

import { Paper, Stack, Text } from "@mantine/core";
import { Button } from "../ui/Button";
import { isCaseContactComplete } from "@repo/validation";
import { missingContactLabels } from "../../../../_components/case-contact";
import s from "./overview.module.css";

interface ContactNextStepCardProps {
  contact: unknown;
  onOpenSettings: () => void;
}

/** Shown until name, phone and email are saved for this project. */
export default function ContactNextStepCard({ contact, onOpenSettings }: ContactNextStepCardProps) {
  if (isCaseContactComplete(contact)) return null;
  const missing = missingContactLabels(contact).join(", ");

  return (
    <Paper p="lg" radius="md" withBorder>
      <Stack gap="xs" align="flex-start">
        <h2 className={s.sectionTitle}>Việc tiếp theo: điền thông tin liên hệ</h2>
        <Text className={s.body}>
          Còn thiếu {missing}. Chúng tôi dùng để báo kết quả và gửi mã QR thanh toán cho đúng người.
        </Text>
        <Button variant="primary" size="md" onClick={onOpenSettings}>
          Điền thông tin liên hệ
        </Button>
      </Stack>
    </Paper>
  );
}
