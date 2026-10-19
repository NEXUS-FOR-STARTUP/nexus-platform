"use client";

import { Alert, Button, List } from "@mantine/core";
import { ArrowRight } from "@phosphor-icons/react";

interface OverviewIdeaGuideAlertProps {
  onOpenStage: (slug: string, view: "draft" | "files" | "results") => void;
}

export default function OverviewIdeaGuideAlert({ onOpenStage }: OverviewIdeaGuideAlertProps) {
  return (
    <Alert variant="light" color="blue" title="Bắt đầu từ ý tưởng của bạn">
      <List size="sm" spacing={2} mb="sm">
        <List.Item>Điền mẫu ý tưởng bằng những gì nhóm đã biết.</List.Item>
        <List.Item>Gửi để Nexus chấm bài và nhận báo cáo phản biện.</List.Item>
        <List.Item>Sửa ý tưởng theo báo cáo, rồi đánh giá lại.</List.Item>
      </List>
      <Button
        size="sm"
        variant="light"
        rightSection={<ArrowRight size={14} />}
        onClick={() => onOpenStage("y-tuong", "draft")}
      >
        Mở mẫu ý tưởng
      </Button>
    </Alert>
  );
}
