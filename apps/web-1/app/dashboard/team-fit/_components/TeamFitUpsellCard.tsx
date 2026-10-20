import { PACKAGE_KEYS, formatPrice } from "@/lib/pricing";
import { usePackagePrice } from "@/lib/usePackagePrice";
import { Button, Paper, Text } from "@mantine/core";

interface TeamFitUpsellCardProps {
  onUpgrade: () => void;
  isUpgrading?: boolean;
}

export default function TeamFitUpsellCard({ onUpgrade, isUpgrading = false }: TeamFitUpsellCardProps) {
  const { data: auditPkg } = usePackagePrice(PACKAGE_KEYS.AI_AUDIT);
  const auditPriceLabel = formatPrice(auditPkg?.price ?? 79000);

  return (
    <Paper radius="2xl" p="lg" bg="var(--mantine-color-brand-light)">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Text size="sm" fw={700}>
            Cần đánh giá sâu hơn từ tài liệu?
          </Text>
          <Text size="sm" c="dimmed">
            Gói {auditPriceLabel} gồm 2 lượt phản biện chi tiết.
          </Text>
        </div>
        <Button variant="outline" color="brand" onClick={onUpgrade} loading={isUpgrading}>
          Đánh giá dự án
        </Button>
      </div>
    </Paper>
  );
}
