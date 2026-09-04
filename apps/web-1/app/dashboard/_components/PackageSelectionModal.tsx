"use client";

import { Modal, Card, Text, Group, Button, Stack, Badge, ThemeIcon, List } from "@mantine/core";
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
      <Stack gap="md" className="md:flex-row">
        {/* Basic AI Audit */}
        <Card withBorder radius="md" padding="lg" className="flex-1 bg-surface-card border-border-app">
          <Stack justify="space-between" className="h-full">
            <div>
              <Text className="font-display font-semibold text-text-app mb-1">Basic AI Audit</Text>
              <Group align="flex-end" gap="xs" mb="md">
                <Text className="text-2xl font-display font-bold text-text-app">79.000</Text>
                <Text className="font-body text-text-muted text-sm pb-1">VNĐ</Text>
              </Group>
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
              className="font-body text-text-app border-border-app"
            >
              Chọn Basic
            </Button>
          </Stack>
        </Card>

        {/* Premium Mentor Audit */}
        <Card withBorder radius="md" padding="lg" className="flex-1 bg-surface-card border-brand/40 relative">
          <Badge variant="filled" color="blue" className="absolute top-2 right-2">
            Khuyên dùng
          </Badge>
          <Stack justify="space-between" className="h-full">
            <div>
              <Text className="font-display font-semibold text-brand mb-1">Premium Mentor Audit</Text>
              <Group align="flex-end" gap="xs" mb="md">
                <Text className="text-2xl font-display font-bold text-text-app">149.000</Text>
                <Text className="font-body text-text-muted text-sm pb-1">VNĐ</Text>
              </Group>
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
              className="font-body font-semibold"
            >
              Chọn Premium
            </Button>
          </Stack>
        </Card>
      </Stack>
    </Modal>
  );
}