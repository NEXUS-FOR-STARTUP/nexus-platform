'use client';

import { Button, Modal, Radio } from '@mantine/core';

interface NewsFilterModalProps {
  opened: boolean;
  onClose: () => void;
  selectedType: string;
  onTypeChange: (val: string) => void;
  onApply: () => void;
  onReset: () => void;
}

export function NewsFilterModal({
  opened,
  onClose,
  selectedType,
  onTypeChange,
  onApply,
  onReset,
}: NewsFilterModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<span className="font-bold text-base text-text-app">Bộ lọc nội dung</span>}
      size="xs"
      centered
      radius="md"
      padding="lg"
    >
      <div className="pt-2 pb-1">
        <div className="mb-6">
          <label className="block text-sm font-semibold text-text-app mb-3.5">
            Loại nội dung
          </label>
          <Radio.Group value={selectedType} onChange={onTypeChange}>
            <div className="flex flex-col gap-3.5 pl-0.5">
              <Radio
                value=""
                label="Tất cả nội dung"
                size="sm"
                className="cursor-pointer"
                classNames={{
                  label: 'cursor-pointer pl-3 text-sm font-normal text-text-app select-none',
                  radio: 'cursor-pointer',
                }}
              />
              <Radio
                value="article"
                label="Bài viết"
                size="sm"
                className="cursor-pointer"
                classNames={{
                  label: 'cursor-pointer pl-3 text-sm font-normal text-text-app select-none',
                  radio: 'cursor-pointer',
                }}
              />
              <Radio
                value="video"
                label="Video"
                size="sm"
                className="cursor-pointer"
                classNames={{
                  label: 'cursor-pointer pl-3 text-sm font-normal text-text-app select-none',
                  radio: 'cursor-pointer',
                }}
              />
            </div>
          </Radio.Group>
        </div>

        <div className="flex items-center justify-end gap-2 pt-4">
          <Button
            variant="subtle"
            color="gray"
            size="sm"
            onClick={onReset}
            className="font-medium"
          >
            Đặt lại
          </Button>
          <Button
            color="brand"
            size="sm"
            onClick={onApply}
            className="font-semibold px-4"
          >
            Áp dụng
          </Button>
        </div>
      </div>
    </Modal>
  );
}
