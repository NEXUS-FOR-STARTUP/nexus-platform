import React from 'react';
import Image from 'next/image';
import { Stack, TextInput, Text, FileInput } from '@mantine/core';
import { Upload, Video } from 'lucide-react';

interface YouTubePreviewSectionProps {
  value: string;
  onChange: (val: string) => void;
  videoId: string | null;
  error?: string | null;
}

export function YouTubePreviewSection({ value, onChange, videoId, error }: YouTubePreviewSectionProps) {
  return (
    <Stack gap="md">
      <TextInput
        label="Đường dẫn hoặc ID video YouTube"
        withAsterisk
        placeholder="https://www.youtube.com/watch?v=... hoặc https://youtu.be/..."
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        required
        error={error}
      />
      <div className="p-4 border border-border-app rounded-xl bg-surface-soft space-y-2">
        <Text size="xs" fw={600} c="dimmed">
          Xem trước video YouTube {videoId ? `(ID: ${videoId})` : ''}
        </Text>
        <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-border-app bg-black flex items-center justify-center">
          {videoId ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${videoId}`}
              title="YouTube video player"
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-zinc-500 gap-2 p-6 text-center">
              <Video size={48} className="text-zinc-600" />
              <Text size="sm" c="dimmed">Nhập đường dẫn YouTube hợp lệ ở trên để xem trước video tại đây</Text>
            </div>
          )}
        </div>
      </div>
    </Stack>
  );
}

interface ArticleCoverSectionProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  alt: string;
  onAltChange: (alt: string) => void;
  existingUrl?: string | null;
  fileError?: string | null;
  altError?: string | null;
  required?: boolean;
}

export function ArticleCoverSection({
  file, onFileChange, alt, onAltChange, existingUrl, fileError, altError, required = false,
}: ArticleCoverSectionProps) {
  const previewUrl = React.useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  React.useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);
  const displayUrl = previewUrl || existingUrl;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <FileInput
          label="Ảnh bìa bài viết"
          withAsterisk={required}
          placeholder="Chọn tệp ảnh (JPEG, PNG, WebP ≤ 5MB)"
          leftSection={<Upload size={16} />}
          value={file}
          onChange={onFileChange}
          accept="image/jpeg,image/png,image/webp"
          error={fileError}
        />
        {displayUrl && (
          <div className="mt-2 relative aspect-video w-36 rounded-md overflow-hidden border border-border-app">
            <Image src={displayUrl} alt={alt || 'Cover'} fill className="object-cover" unoptimized={Boolean(previewUrl)} />
          </div>
        )}
      </div>
      <TextInput
        label="Mô tả ảnh bìa (Alt text)"
        withAsterisk={required}
        placeholder="Mô tả ảnh cho người khiếm thị"
        value={alt}
        onChange={(e) => onAltChange(e.currentTarget.value)}
        maxLength={200}
        error={altError}
      />
    </div>
  );
}
