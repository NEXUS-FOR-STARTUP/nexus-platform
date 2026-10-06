'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Card, Group, SegmentedControl, Stack, Text, TextInput, Textarea, Title, Select, TagsInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { ArrowLeft, Save } from 'lucide-react';
import { useCreateNewsItem, useUploadNewsCover } from '@/app/admin/hooks/useAdminNews';
import { NewsRichTextEditor } from '@/app/admin/_components/news/NewsRichTextEditor';
import { YouTubePreviewSection, ArticleCoverSection } from '@/app/admin/_components/news/NewsEditorFormSections';
import { NEWS_CATEGORIES, generateNewsSlug, extractYouTubeVideoId } from '@repo/validation';

export default function NewWriterNewsItemPage() {
  const router = useRouter();
  const createMutation = useCreateNewsItem();
  const uploadCoverMutation = useUploadNewsCover();

  const [type, setType] = useState<'article' | 'video'>('article');
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugCustomized, setSlugCustomized] = useState(false);
  const [category, setCategory] = useState<string>('khoi-nghiep');
  const [tags, setTags] = useState<string[]>([]);
  const [excerpt, setExcerpt] = useState('');
  const [contentJson, setContentJson] = useState<unknown>({ type: 'doc', content: [{ type: 'paragraph' }] });
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverAlt, setCoverAlt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; youtube?: string }>({});

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slugCustomized && type === 'article') {
      setSlug(generateNewsSlug(val));
    }
  };

  const youtubeVideoId = type === 'video' ? extractYouTubeVideoId(youtubeUrl) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: { title?: string; youtube?: string } = {};
    if (!title.trim()) errs.title = 'Vui lòng nhập tiêu đề';
    if (type === 'video' && !youtubeVideoId) errs.youtube = 'Vui lòng nhập đường dẫn YouTube hợp lệ';
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      notifications.show({ title: 'Lỗi nhập liệu', message: 'Vui lòng kiểm tra các trường bị báo đỏ', color: 'red' });
      return;
    }
    setErrors({});
    setIsSubmitting(true);
    try {
      const created = await createMutation.mutateAsync(
        type === 'article'
          ? {
              type: 'article',
              title: title.trim(),
              slug: slug.trim() || undefined,
              excerpt: excerpt.trim(),
              category,
              tags,
              content_json: contentJson,
              cover_image_url: coverFile ? undefined : (coverUrl.trim() || undefined),
              cover_image_alt: coverAlt.trim() || undefined,
            }
          : {
              type: 'video',
              title: title.trim(),
              excerpt: excerpt.trim(),
              category,
              tags,
              youtube_url_or_id: youtubeUrl.trim(),
            }
      );

      // If cover image was selected for article, upload it now
      if (type === 'article' && coverFile && created.id) {
        try {
          await uploadCoverMutation.mutateAsync({
            id: created.id,
            file: coverFile,
            expected_updated_at: created.updated_at,
          });
        } catch {
          notifications.show({
            title: 'Cảnh báo',
            message: 'Tạo bài thành công nhưng tải ảnh bìa thất bại. Vui lòng tải lại ảnh trong trang chỉnh sửa.',
            color: 'yellow',
          });
        }
      }

      notifications.show({ title: 'Thành công', message: `Đã tạo ${type === 'article' ? 'bài viết' : 'video'} bản nháp!`, color: 'green' });
      router.push('/writer');
    } catch {
      notifications.show({ title: 'Lỗi tạo nội dung', message: 'Không thể tạo bản nháp. Vui lòng kiểm tra lại.', color: 'red' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      <Group justify="space-between" align="center">
        <Button component={Link} href="/writer" variant="subtle" color="gray" leftSection={<ArrowLeft size={16} />} size="sm">
          Quay lại danh sách
        </Button>
        <Title order={3} className="text-xl font-bold text-text-app">
          Tạo nội dung mới
        </Title>
      </Group>

      <form
        className="w-full"
        onSubmit={handleSubmit}
        onKeyDown={(e) => { if (e.key === 'Enter' && (e.target as HTMLElement)?.tagName === 'INPUT') e.preventDefault(); }}
      >
        <Card p="xl" radius="md" withBorder className="space-y-6 bg-surface-app border-border-app">
          {/* Content Type Selector */}
          <div>
            <Text size="sm" fw={600} mb="xs" className="text-text-app">
              Loại nội dung
            </Text>
            <SegmentedControl
              value={type}
              onChange={(val) => {
                setType(val as 'article' | 'video');
                setErrors({});
              }}
              data={[
                { label: 'Bài viết', value: 'article' },
                { label: 'Video YouTube', value: 'video' },
              ]}
              radius="md"
              color="brand"
            />
          </div>

          <TextInput
            label="Tiêu đề"
            placeholder="Nhập tiêu đề hấp dẫn..."
            value={title}
            onChange={(e) => handleTitleChange(e.currentTarget.value)}
            error={errors.title}
            required
            maxLength={160}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Chuyên mục"
              data={NEWS_CATEGORIES.map((c) => ({ value: c.slug, label: c.name }))}
              value={category}
              onChange={(val) => setCategory(val || 'khoi-nghiep')}
              searchable
              radius="md"
              required
            />

            <TagsInput
              label="Thẻ từ khóa (Tags)"
              placeholder="Nhập tag rồi gõ Enter"
              value={tags}
              onChange={setTags}
              maxTags={5}
              radius="md"
            />
          </div>

          <Textarea
            label="Tóm tắt ngắn (Excerpt)"
            placeholder="Đoạn văn ngắn giới thiệu nội dung hiển thị ở danh sách bài viết..."
            value={excerpt}
            onChange={(e) => setExcerpt(e.currentTarget.value)}
            rows={3}
            maxLength={300}
          />

          {type === 'article' ? (
            <Stack gap="md">
              <TextInput
                label="Đường dẫn tĩnh (Slug)"
                description="Tự động tạo từ tiêu đề. Có thể chỉnh sửa thủ công."
                placeholder="duong-dan-bai-viet"
                value={slug}
                onChange={(e) => {
                  setSlug(e.currentTarget.value);
                  setSlugCustomized(true);
                }}
                maxLength={160}
              />

              <ArticleCoverSection
                file={coverFile}
                onFileChange={setCoverFile}
                url={coverUrl}
                onUrlChange={setCoverUrl}
                alt={coverAlt}
                onAltChange={setCoverAlt}
                required
              />

              <div>
                <Text size="sm" fw={600} mb={2} className="text-text-app">
                  Nội dung chi tiết <span className="text-red-500">*</span>
                </Text>
                <Text size="xs" c="dimmed" mb="xs">
                  Soạn thảo bài viết trực tiếp gồm tiêu đề, in đậm, danh sách và liên kết.
                </Text>
                <NewsRichTextEditor content={contentJson} onChange={setContentJson} />
              </div>
            </Stack>
          ) : (
            <YouTubePreviewSection
              value={youtubeUrl}
              onChange={(val) => { setYoutubeUrl(val); setErrors((p) => ({ ...p, youtube: undefined })); }}
              videoId={youtubeVideoId}
              error={errors.youtube}
            />
          )}

          {/* Submit button */}
          <Group justify="flex-end" pt="md" className="border-t border-border-app">
            <Button
              type="submit"
              color="brand"
              size="md"
              radius="md"
              loading={isSubmitting}
              leftSection={<Save size={18} />}
            >
              Lưu bản nháp
            </Button>
          </Group>
        </Card>
      </form>
    </div>
  );
}
