'use client';

import { useEffect, useMemo, useState } from 'react';
import { Modal, TextInput, Button, Group, SegmentedControl, FileInput } from '@mantine/core';
import { useUploadNewsContentImage } from '@/app/admin/hooks/useAdminNews';

const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp';
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

type ImageSource = 'upload' | 'url';

interface NewsImageInsertModalProps {
  opened: boolean;
  onClose: () => void;
  onInsert: (src: string, alt: string) => void;
}

export function NewsImageInsertModal({ opened, onClose, onInsert }: NewsImageInsertModalProps) {
  const [source, setSource] = useState<ImageSource>('upload');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [alt, setAlt] = useState('');
  const [error, setError] = useState('');
  const upload = useUploadNewsContentImage();

  const filePreviewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(
    () => () => {
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    },
    [filePreviewUrl],
  );
  const previewUrl = source === 'upload' ? filePreviewUrl : url;

  const reset = () => {
    setUrl('');
    setFile(null);
    setAlt('');
    setError('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const finish = (src: string) => {
    onInsert(src, alt.trim());
    handleClose();
  };

  const handleInsert = () => {
    if (source === 'upload') {
      if (!file) {
        setError('Vui lòng chọn tệp ảnh');
        return;
      }
      if (!IMAGE_ACCEPT.split(',').includes(file.type)) {
        setError('Định dạng ảnh không hỗ trợ. Vui lòng chọn JPEG, PNG hoặc WebP');
        return;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        setError('Ảnh không được vượt quá 5MB');
        return;
      }
      upload.mutate(file, {
        onSuccess: finish,
        onError: (err) => setError(err.message),
      });
      return;
    }

    const trimmed = url.trim();
    if (!trimmed) {
      setError('Vui lòng nhập URL hình ảnh');
      return;
    }
    if (!URL.canParse(trimmed)) {
      setError('URL hình ảnh không hợp lệ');
      return;
    }
    if (!['http:', 'https:'].includes(new URL(trimmed).protocol)) {
      setError('URL hình ảnh phải bắt đầu bằng http:// hoặc https://');
      return;
    }
    finish(trimmed);
  };

  return (
    <Modal opened={opened} onClose={handleClose} title="Chèn hình ảnh vào bài viết" centered size="md">
      <div className="space-y-4">
        <SegmentedControl
          fullWidth
          value={source}
          onChange={(val) => {
            setSource(val as ImageSource);
            setError('');
          }}
          data={[
            { label: 'Tải ảnh từ máy', value: 'upload' },
            { label: 'Nhập URL ảnh', value: 'url' },
          ]}
        />
        {source === 'upload' ? (
          <FileInput
            label="Chọn ảnh từ máy"
            placeholder="JPEG, PNG hoặc WebP, tối đa 5MB"
            accept={IMAGE_ACCEPT}
            value={file}
            onChange={(f) => {
              setFile(f);
              setError('');
            }}
            error={error}
            clearable
            withAsterisk
          />
        ) : (
          <TextInput
            label="URL hình ảnh"
            placeholder="https://example.com/image.jpg"
            value={url}
            onChange={(e) => {
              setUrl(e.currentTarget.value);
              setError('');
            }}
            error={error}
            withAsterisk
          />
        )}
        <TextInput
          label="Mô tả hình ảnh hoặc chú thích"
          placeholder="Ví dụ: Đồ thị tăng trưởng người dùng 2025"
          value={alt}
          onChange={(e) => setAlt(e.currentTarget.value)}
        />
        {previewUrl && !error && (
          <div className="mt-2 border border-border-app rounded-md overflow-hidden bg-surface-soft p-2">
            <p className="text-xs text-text-muted mb-1 font-medium">Xem trước:</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Preview"
              className="max-h-48 max-w-full mx-auto object-contain rounded"
              onError={() => setError('Không thể tải ảnh từ URL này. Vui lòng kiểm tra lại link.')}
            />
          </div>
        )}
        <Group justify="flex-end" gap="sm" pt="xs">
          <Button variant="default" onClick={handleClose} disabled={upload.isPending}>
            Hủy
          </Button>
          <Button color="brand" onClick={handleInsert} loading={upload.isPending}>
            Chèn ảnh
          </Button>
        </Group>
      </div>
    </Modal>
  );
}
