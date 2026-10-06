import React from 'react';
import { Modal, Text, Group, Button } from '@mantine/core';
import type { NewsItemAdmin } from '@repo/validation';

interface NewsTableModalsProps {
  deleteTarget: NewsItemAdmin | null;
  setDeleteTarget: (val: NewsItemAdmin | null) => void;
  publishTarget: NewsItemAdmin | null;
  setPublishTarget: (val: NewsItemAdmin | null) => void;
  unpublishTarget: NewsItemAdmin | null;
  setUnpublishTarget: (val: NewsItemAdmin | null) => void;
  onDelete: (item: NewsItemAdmin) => Promise<void>;
  onPublish: (item: NewsItemAdmin) => Promise<void>;
  onUnpublish: (item: NewsItemAdmin) => Promise<void>;
  isActionLoading: boolean;
}

export function NewsTableModals({
  deleteTarget,
  setDeleteTarget,
  publishTarget,
  setPublishTarget,
  unpublishTarget,
  setUnpublishTarget,
  onDelete,
  onPublish,
  onUnpublish,
  isActionLoading,
}: NewsTableModalsProps) {
  return (
    <>
      <Modal
        opened={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Xác nhận xóa bản nháp"
        centered
      >
        <Text size="sm" mb="lg">
          Bạn có chắc muốn xóa bản nháp <strong className="text-text-app">{deleteTarget?.title}</strong> không?
        </Text>
        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={() => setDeleteTarget(null)}>Hủy</Button>
          <Button
            color="red"
            loading={isActionLoading}
            onClick={async () => {
              if (deleteTarget) {
                await onDelete(deleteTarget);
                setDeleteTarget(null);
              }
            }}
          >
            Xác nhận xóa
          </Button>
        </Group>
      </Modal>

      <Modal
        opened={publishTarget !== null}
        onClose={() => setPublishTarget(null)}
        title="Xuất bản nội dung"
        centered
      >
        <Text size="sm" mb="lg">
          Nội dung <strong className="text-text-app">{publishTarget?.title}</strong> sẽ hiển thị công khai ngay lập tức.
        </Text>
        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={() => setPublishTarget(null)}>Hủy</Button>
          <Button
            color="brand"
            loading={isActionLoading}
            onClick={async () => {
              if (publishTarget) {
                await onPublish(publishTarget);
                setPublishTarget(null);
              }
            }}
          >
            Xuất bản ngay
          </Button>
        </Group>
      </Modal>

      <Modal
        opened={unpublishTarget !== null}
        onClose={() => setUnpublishTarget(null)}
        title="Hủy xuất bản"
        centered
      >
        <Text size="sm" mb="lg">
          Nội dung <strong className="text-text-app">{unpublishTarget?.title}</strong> sẽ chuyển về bản nháp.
        </Text>
        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={() => setUnpublishTarget(null)}>Hủy</Button>
          <Button
            color="orange"
            loading={isActionLoading}
            onClick={async () => {
              if (unpublishTarget) {
                await onUnpublish(unpublishTarget);
                setUnpublishTarget(null);
              }
            }}
          >
            Hủy xuất bản
          </Button>
        </Group>
      </Modal>
    </>
  );
}
