"use client";

import { Modal, Card, Text, Button, Stack, Badge, ThemeIcon, List, SimpleGrid } from "@mantine/core";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { PACKAGE_KEYS } from "@/lib/pricing";

interface PackageSelectionModalProps {
  opened: boolean;
  onClose: () => void;
}

export function PackageSelectionModal({ opened, onClose }: PackageSelectionModalProps) {
  const router = useRouter();

  const handleSelect = (packageId: string) => {
    router.push(`/dashboard/intake?packageId=${packageId}`);
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Text className="font-display font-semibold text-lg">Chọn gói kiểm tra</Text>}
      size="xl"
      centered
      radius="md"
      classNames={{
        header: "border-b border-border-app bg-surface-app",
        body: "bg-surface-app p-4 sm:p-6",
      }}
    >
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        {/* Basic AI Audit */}
        <Card withBorder radius="md" padding="lg" className="bg-surface-card border-border-app flex flex-col justify-between">
          <Stack justify="space-between" className="h-full">
            <div>
              <h4 className="font-heading font-bold text-lg text-text-app mb-1">Basic AI Audit</h4>
              <div className="flex items-baseline gap-1.5 mb-3">
                <span className="text-2xl font-heading font-bold text-text-app">79,000</span>
                <span className="font-body text-text-muted text-sm">VND</span>
              </div>
              <Text size="sm" c="dimmed" className="font-body mb-4 min-h-[40px]">
                Phân tích tự động bằng AI. Báo cáo trả về tức thì.
              </Text>
              <List
                spacing="xs"
                size="sm"
                className="font-body mb-6"
                icon={
                  <ThemeIcon color="green" size={20} radius="xl" variant="light">
                    <Check size={12} strokeWidth={3} />
                  </ThemeIcon>
                }
              >
                <List.Item>Chấm điểm theo Rubric</List.Item>
                <List.Item>Xác định lỗi Logic cơ bản</List.Item>
                <List.Item>Trả kết quả tức thì</List.Item>
              </List>
            </div>
            <Button
              variant="default"
              fullWidth
              onClick={() => handleSelect(PACKAGE_KEYS.AI_AUDIT)}
              className="font-body text-text-app border-border-app mt-4"
            >
              Chọn Basic
            </Button>
          </Stack>
        </Card>

        {/* Premium Mentor Audit */}
        <Card withBorder radius="md" padding="lg" className="bg-surface-card border-brand/40 relative flex flex-col justify-between">
          <Badge variant="filled" color="blue" className="absolute top-2 right-2">
            Khuyên dùng
          </Badge>
          <Stack justify="space-between" className="h-full">
            <div>
              <h4 className="font-heading font-bold text-lg text-brand mb-1">Premium Mentor Audit</h4>
              <div className="flex items-baseline gap-1.5 mb-3">
                <span className="text-2xl font-heading font-bold text-text-app">149,000</span>
                <span className="font-body text-text-muted text-sm">VND</span>
              </div>
              <Text size="sm" c="dimmed" className="font-body mb-4 min-h-[40px]">
                Mentor FPT trực tiếp review, sửa lỗi chặn và định hướng thực chiến.
              </Text>
              <List
                spacing="xs"
                size="sm"
                className="font-body mb-6"
                icon={
                  <ThemeIcon color="blue" size={20} radius="xl" variant="light">
                    <Check size={12} strokeWidth={3} />
                  </ThemeIcon>
                }
              >
                <List.Item>Bao gồm tính năng của Basic AI</List.Item>
                <List.Item>Định hướng sửa bài thực chiến</List.Item>
                <List.Item>Nhận báo cáo sau 24h-48h</List.Item>
              </List>
            </div>
            <Button
              color="blue"
              fullWidth
              onClick={() => handleSelect(PACKAGE_KEYS.SUPPORTER_AUDIT)}
              className="font-body font-semibold mt-4"
            >
              Chọn Premium
            </Button>
          </Stack>
        </Card>
      </SimpleGrid>
    </Modal>
  );
}