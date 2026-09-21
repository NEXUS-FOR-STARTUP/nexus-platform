"use client";

import { Modal, Card, Text, Button, Stack, Badge, ThemeIcon, List, SimpleGrid } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { PACKAGE_KEYS } from "@/lib/pricing";

interface PackageSelectionModalProps {
  opened: boolean;
  onClose: () => void;
  onSelectPackage?: (packageId: string) => void;
}

export function PackageSelectionModal({ opened, onClose, onSelectPackage }: PackageSelectionModalProps) {
  const router = useRouter();

  const handleSelect = (packageId: string) => {
    if (packageId === PACKAGE_KEYS.SUPPORTER_AUDIT) {
      notifications.show({
        title: "Tính năng đang được phát triển",
        message: "Gói Premium Mentor Audit hiện đang được hoàn thiện. Vui lòng chọn gói Basic AI Audit (79.000đ) để được hỗ trợ tức thì!",
        color: "blue",
      });
      return;
    }

    if (onSelectPackage) {
      onSelectPackage(packageId);
    } else {
      router.push(`/dashboard/intake?packageId=${packageId}`);
    }
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Text className="font-heading font-semibold text-lg text-text-app">Chọn gói đánh giá cho dự án</Text>}
      size="md"
      centered
      radius="md"
      classNames={{
        header: "border-b border-border-app bg-surface-app",
        body: "bg-surface-app p-4 sm:p-6",
      }}
    >
      <div className="max-w-md mx-auto">
        {/* Đánh giá Dự án Tự động */}
        <Card withBorder radius="md" padding="lg" className="bg-surface-card border-brand/40 relative flex flex-col justify-between">
          <Badge variant="filled" color="brand" className="absolute top-2 right-2">
            Khuyên dùng
          </Badge>
          <Stack justify="space-between" className="h-full">
            <div>
              <h4 className="font-heading font-bold text-lg text-text-app mb-1">
                Đánh giá Dự án Tự động
              </h4>
              <div className="flex items-baseline gap-1.5 mb-3">
                <span className="text-2xl font-heading font-bold text-text-app">79.000đ</span>
                <span className="font-body text-text-muted text-sm">/ Gói 2 lượt đánh giá</span>
              </div>
              <Text size="sm" c="dimmed" className="font-body mb-4 min-h-[40px]">
                Đánh giá tài liệu qua 5 nhóm tiêu chí cốt lõi. Bao gồm 2 lượt (đánh giá ban đầu và đánh giá lại sau khi sửa).
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
                <List.Item>Đánh giá qua 5 nhóm tiêu chí</List.Item>
                <List.Item>Phân loại vấn đề theo mức độ ưu tiên</List.Item>
                <List.Item>Kết quả thường có sau khoảng 10 phút</List.Item>
              </List>
            </div>
            <Button
              color="brand"
              fullWidth
              onClick={() => handleSelect(PACKAGE_KEYS.AI_AUDIT)}
              className="font-body font-semibold mt-4"
            >
              Chọn gói này
            </Button>
          </Stack>
        </Card>
      </div>
    </Modal>
  );
}