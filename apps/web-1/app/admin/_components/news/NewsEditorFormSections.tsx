import React from 'react';
import Image from 'next/image';
import { Stack, TextInput, Text, FileInput, SegmentedControl } from '@mantine/core';
import { Upload, Video, Link2 } from 'lucide-react';

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
  url?: string;
  onUrlChange?: (url: string) => void;
  alt: string;
  onAltChange: (alt: string) => void;
  existingUrl?: string | null;
  fileError?: string | null;
  altError?: string | null;
  required?: boolean;
}

export function ArticleCoverSection({
  file,
  onFileChange,
  url = '',
  onUrlChange,
  alt,
  onAltChange,
  existingUrl,
  fileError,
  altError,
  required = false,
}: ArticleCoverSectionProps) {
  const [sourceType, setSourceType] = React.useState<'upload' | 'url'>(
    url && !file ? 'url' : 'upload'
  );
  const previewUrl = React.useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  React.useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const activeUrl = url?.trim() || null;
  const displayUrl = previewUrl || (sourceType === 'url' ? activeUrl : null) || existingUrl;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Text size="sm" fw={500} className="text-text-app">
          Ảnh bìa bài viết {required && <span className="text-red-500">*</span>}
        </Text>
        <SegmentedControl
          size="xs"
          radius="md"
          value={sourceType}
          onChange={(val) => setSourceType(val as 'upload' | 'url')}
          data={[
            { label: 'Tải tệp ảnh', value: 'upload' },
            { label: 'Nhập URL ảnh', value: 'url' },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
        <div>
          {sourceType === 'upload' ? (
            <FileInput
              label="Chọn tệp ảnh từ máy"
              placeholder="Chọn tệp ảnh (JPEG, PNG, WebP ≤ 5MB)"
              leftSection={<Upload size={16} />}
              value={file}
              onChange={(newFile) => {
                onFileChange(newFile);
                if (newFile && onUrlChange) {
                  onUrlChange('');
                }
              }}
              accept="image/jpeg,image/png,image/webp"
              error={fileError}
            />
          ) : (
            <TextInput
              label="Đường dẫn URL ảnh bìa"
              placeholder="https://images.unsplash.com/... hoặc https://..."
              leftSection={<Link2 size={16} />}
              value={url}
              onChange={(e) => {
                const newUrl = e.currentTarget.value;
                onUrlChange?.(newUrl);
                if (newUrl && file) {
                  onFileChange(null);
                }
              }}
              error={fileError}
            />
          )}

          {displayUrl && (
            <div className="mt-3 flex items-center gap-3">
              <div className="relative aspect-video w-36 rounded-md overflow-hidden border border-border-app bg-surface-soft shrink-0">
                <Image
                  src={displayUrl}
                  alt={alt || 'Cover preview'}
                  fill
                  className="object-cover"
                  unoptimized={true}
                />
              </div>
              <Text size="xs" c="dimmed">
                {previewUrl ? 'Xem trước từ tệp tải lên' : sourceType === 'url' ? 'Xem trước từ URL trực tiếp' : 'Ảnh bìa hiện tại'}
              </Text>
            </div>
          )}
        </div>

        <TextInput
          label="Mô tả ảnh bìa (Alt text)"
          withAsterisk={required}
          placeholder="Mô tả ảnh cho người khiếm thị và SEO"
          value={alt}
          onChange={(e) => onAltChange(e.currentTarget.value)}
          maxLength={200}
          error={altError}
        />
      </div>
    </div>
  );
}
