"use client";

import { Alert, Button, List } from "@mantine/core";
import { ArrowRight, Lightbulb } from "lucide-react";

interface OverviewIdeaGuideAlertProps {
  onOpenStage: (slug: string, view: "draft" | "files" | "results") => void;
}

export default function OverviewIdeaGuideAlert({ onOpenStage }: OverviewIdeaGuideAlertProps) {
  return (
    <Alert variant="light" color="blue" icon={<Lightbulb size={18} />} title="Bắt đầu từ ý tưởng của bạn">
      <List size="sm" spacing={2} mb="sm">
        <List.Item>Mở mẫu ý tưởng và điền những gì bạn đã biết.</List.Item>
        <List.Item>Có thể điền thiếu, cập nhật lại bất cứ lúc nào.</List.Item>
        <List.Item>Điền xong, gửi để nhận báo cáo phản biện.</List.Item>
      </List>
      <Button
        size="xs"
        variant="light"
        rightSection={<ArrowRight size={14} />}
        onClick={() => onOpenStage("y-tuong", "draft")}
      >
        Mở mẫu ý tưởng
      </Button>
    </Alert>
  );
}
