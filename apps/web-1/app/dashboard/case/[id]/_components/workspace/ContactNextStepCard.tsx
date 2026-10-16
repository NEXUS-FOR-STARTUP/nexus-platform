"use client";

import { Alert, Button, Stack, Text } from "@mantine/core";
import { isCaseContactComplete } from "@repo/validation";
import { missingContactLabels } from "../../../../_components/case-contact";

interface ContactNextStepCardProps {
  contact: unknown;
  onOpenSettings: () => void;
}

/** Shown until name, phone and email are saved for this project. */
export default function ContactNextStepCard({ contact, onOpenSettings }: ContactNextStepCardProps) {
  if (isCaseContactComplete(contact)) return null;
  const missing = missingContactLabels(contact).join(", ");

  return (
    <Alert color="yellow" variant="light" radius="md" title="Bạn cần điền thông tin liên hệ trước">
      <Stack gap="sm">
        <Text size="sm">
          Còn thiếu: {missing}. Chúng tôi dùng để báo kết quả và gửi mã QR thanh toán cho đúng người.
        </Text>
        <Button size="md" color="yellow" className="self-start cursor-pointer" onClick={onOpenSettings}>
          Điền thông tin liên hệ
        </Button>
      </Stack>
    </Alert>
  );
}
