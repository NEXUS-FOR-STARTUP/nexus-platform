"use client";

import React, { useState } from "react";
import { Modal, Button, NumberInput, Stack, Text, Group } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";

interface CreditQuantityModalProps {
  caseId: string;
  opened: boolean;
  onClose: () => void;
  packageId?: string;
}

export default function CreditQuantityModal({ caseId, opened, onClose, packageId }: CreditQuantityModalProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState<number>(1);

  const effectivePackageId = packageId || "pkg_tf_audit";

  const { data: pkg } = useQuery({
    queryKey: ["package", "price", effectivePackageId],
    queryFn: () => apiClient.get(`/packages/${effectivePackageId}`).then((r) => r.data),
    enabled: opened && !!effectivePackageId,
  });

  const unitPrice = pkg?.price ?? 0;

  const mutation = useMutation({
    mutationFn: async () => {
      if (packageId === "pkg_tf_free") {
        await apiClient.post(`/cases/${caseId}/upgrade-package`, {
          packageId: "pkg_tf_audit",
        });
      }
      const res = await apiClient.post("/orders", {
        items: [
          {
            service_type: "credit_audit",
            quantity,
            metadata_json: { case_id: caseId },
          },
        ],
      });
      return res.data;
    },
    onSuccess: (data) => {
      notifications.show({
        title: "Tạo đơn hàng thành công",
        message: `Đơn hàng #${data.orderId} đã được tạo.`,
        color: "teal",
      });
      router.refresh();
      handleClose();
    },
    onError: (error: any) => {
      notifications.show({
        title: "Tạo đơn hàng thất bại",
        message: error?.response?.data?.message || "Vui lòng thử lại sau.",
        color: "red",
      });
    },
  });

  const handleClose = () => {
    mutation.reset();
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={<Text fw={700} size="sm">Mua credit</Text>}
      size="md"
      radius="md"
      centered
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Chọn số lượng credit muốn mua. Mỗi credit tương ứng với một lượt đánh giá từ Supporter.
        </Text>

        <NumberInput
          label="Số lượng credit"
          description="Từ 1 đến 50 credit"
          value={quantity}
          onChange={(val) => setQuantity(Number(val) || 1)}
          min={1}
          max={50}
          allowDecimal={false}
          allowNegative={false}
        />

        <div className="bg-surface-soft rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Đơn giá</span>
            <span className="font-semibold">{unitPrice.toLocaleString("vi-VN")}₫</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Số lượng</span>
            <span className="font-semibold">{quantity}</span>
          </div>
          <div className="border-t border-border-app pt-2 flex justify-between">
            <span className="font-semibold">Tổng cộng</span>
            <span className="font-semibold text-brand">
              {(quantity * unitPrice).toLocaleString("vi-VN")}₫
            </span>
          </div>
        </div>

        <Group justify="flex-end" mt="sm">
          <Button variant="default" onClick={handleClose} disabled={mutation.isPending}>
            Hủy
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            loading={mutation.isPending}
            disabled={mutation.isPending}
          >
            Xác nhận mua
          </Button>
        </Group>

        {mutation.isError && (
          <Text c="red" size="xs">
            {(mutation.error as any)?.response?.data?.message || "Đã xảy ra lỗi."}
          </Text>
        )}
      </Stack>
    </Modal>
  );
}
