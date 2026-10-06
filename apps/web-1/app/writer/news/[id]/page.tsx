'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Button, Card, Group, Stack, Text, TextInput, Textarea, Badge, Modal, Select, TagsInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { ArrowLeft, Save, Send, Undo2, ExternalLink } from 'lucide-react';
import { useAdminNewsDetail, useUpdateNewsItem, usePublishNewsItem, useUnpublishNewsItem, useUploadNewsCover } from '@/app/admin/hooks/useAdminNews';
import { NewsRichTextEditor } from '@/app/admin/_components/news/NewsRichTextEditor';
import { YouTubePreviewSection, ArticleCoverSection } from '@/app/admin/_components/news/NewsEditorFormSections';
import {
  NEWS_CATEGORIES,
  NEWS_EXCERPT_MAX_LENGTH,
  NEWS_TITLE_MAX_LENGTH,
  NEWS_SLUG_MAX_LENGTH,
  extractYouTubeVideoId,
} from '@repo/validation';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export default function EditWriterNewsItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: item, isLoading, isError, refetch } = useAdminNewsDetail(id);

  const updateMutation = useUpdateNewsItem();
  const publishMutation = usePublishNewsItem();
  const unpublishMutation = useUnpublishNewsItem();
  const uploadCoverMutation = useUploadNewsCover();

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState<string>('khoi-nghiep');
  const [tags, setTags] = useState<string[]>([]);
  const [excerpt, setExcerpt] = useState('');
  const [contentJson, setContentJson] = useState<unknown>({ type: 'doc', content: [{ type: 'paragraph' }] });
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [coverAlt, setCoverAlt] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [errors, setErrors] = useState<{
    title?: string;
    slug?: string;
    cover?: string;
    alt?: string;
    youtube?: string;
    content?: string;
    excerpt?: string;
  }>({});

  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setSlug(item.slug || '');
      setCategory(item.category || 'khoi-nghiep');
      setTags(item.tags || []);
      setExcerpt(item.excerpt || '');
      setContentJson(item.content_json || { type: 'doc', content: [{ type: 'paragraph' }] });
      setYoutubeUrl(item.youtube_video_id ? `https://www.youtube.com/watch?v=${item.youtube_video_id}` : '');
      setCoverUrl(item.cover_image_url || '');
      setCoverAlt(item.cover_image_alt || '');
      setErrors({});
    }
  }, [item]);

  if (isLoading) return <div className="max-w-4xl mx-auto p-6 space-y-4"><LoadingSkeleton variant="card" count={2} /></div>;
  if (isError || !item) return (
    <div className="max-w-4xl mx-auto p-6 text-center">
      <Text c="red" mb="md">Không tìm thấy mục tin tức hoặc đã xảy ra lỗi tải dữ liệu.</Text>
      <Button component={Link} href="/writer" variant="default">Quay lại</Button>
    </div>
  );

  const isPublished = item.status === 'published';
  const youtubeVideoId = item.type === 'video' ? extractYouTubeVideoId(youtubeUrl) : null;

  const origYt = item.youtube_video_id ? `https://www.youtube.com/watch?v=${item.youtube_video_id}` : '';
  const isDirty = coverFile !== null
    || coverUrl !== (item.cover_image_url ?? '')
    || title !== item.title
    || excerpt !== (item.excerpt ?? '')
    || coverAlt !== (item.cover_image_alt ?? '')
    || category !== (item.category ?? 'khoi-nghiep')
    || JSON.stringify(tags) !== JSON.stringify(item.tags ?? [])
    || (item.type === 'article' && (slug !== (item.slug ?? '') || JSON.stringify(contentJson) !== JSON.stringify(item.content_json)))
    || (item.type === 'video' && youtubeUrl !== origYt);

  const isExcerptOverLimit = excerpt.length > NEWS_EXCERPT_MAX_LENGTH;
  const isTitleOverLimit = title.length > NEWS_TITLE_MAX_LENGTH;
  const isSlugOverLimit = slug.length > NEWS_SLUG_MAX_LENGTH;

  const handleSaveInternal = async () => {
    const errs: { title?: string; slug?: string; youtube?: string; cover?: string; alt?: string; content?: string; excerpt?: string } = {};
    if (!title.trim()) {
      errs.title = 'Tiêu đề không được để trống';
    } else if (title.length > NEWS_TITLE_MAX_LENGTH) {
      errs.title = `Tiêu đề vượt quá ${title.length - NEWS_TITLE_MAX_LENGTH} ký tự cho phép`;
    }

    if (excerpt.length > NEWS_EXCERPT_MAX_LENGTH) {
      errs.excerpt = `Tóm tắt nội dung vượt quá ${excerpt.length - NEWS_EXCERPT_MAX_LENGTH} ký tự cho phép`;
    }

    if (item.type === 'article' && slug.length > NEWS_SLUG_MAX_LENGTH) {
      errs.slug = `Đường dẫn tĩnh vượt quá ${slug.length - NEWS_SLUG_MAX_LENGTH} ký tự cho phép`;
    }

    if (item.type === 'video' && !youtubeVideoId) {
      errs.youtube = 'Vui lòng nhập URL hoặc ID video YouTube hợp lệ';
    }

    if (isPublished && item.type === 'article') {
      const hasCover = Boolean(coverFile) || Boolean(coverUrl.trim()) || Boolean(item.cover_image_url);
      if (!hasCover) errs.cover = 'Bài viết đã xuất bản phải có ảnh bìa';
      if (!coverAlt.trim()) errs.alt = 'Bài viết đã xuất bản phải có mô tả ảnh bìa';
      if (!contentJson) errs.content = 'Nội dung bài viết không được để trống';
    }

    if (Object.keys(errs).length > 0) {
      setErrors((p) => ({ ...p, ...errs }));
      notifications.show({ title: 'Lỗi nhập liệu', message: 'Vui lòng kiểm tra các trường bị báo đỏ', color: 'red' });
      return null;
    }

    setIsSubmitting(true);
    try {
      let updated = await updateMutation.mutateAsync({
        id: item.id,
        data: {
          title: title.trim(),
          slug: item.type === 'article' && !isPublished ? slug.trim() : undefined,
          category,
          tags,
          excerpt: excerpt.trim(),
          content_json: item.type === 'article' ? contentJson : undefined,
          youtube_url_or_id: item.type === 'video' ? youtubeUrl.trim() : undefined,
          cover_image_url: coverFile ? undefined : (coverUrl.trim() || null),
          cover_image_alt: item.type === 'article' ? coverAlt.trim() : undefined,
          expected_updated_at: item.updated_at,
        },
      });
      if (coverFile && item.type === 'article') {
        updated = await uploadCoverMutation.mutateAsync({
          id: item.id,
          file: coverFile,
          expected_updated_at: updated.updated_at,
        });
        setCoverFile(null);
        setCoverUrl(updated.cover_image_url || '');
      }
      notifications.show({ title: 'Thành công', message: 'Đã lưu thay đổi!', color: 'green' });
      refetch();
      return updated.updated_at;
    } catch {
      notifications.show({ title: 'Lỗi lưu', message: 'Dữ liệu có thể đã bị sửa bởi người khác hoặc thông tin không hợp lệ.', color: 'red' });
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSaveInternal();
  };

  const handleDoPublish = async (latestUpdatedAt?: string) => {
    setIsSubmitting(true);
    try {
      const ts = latestUpdatedAt ?? item.updated_at;
      if (isPublished) {
        await unpublishMutation.mutateAsync({ id: item.id, expected_updated_at: ts });
        notifications.show({ title: 'Đã hủy xuất bản', message: 'Bài viết đã chuyển về bản nháp', color: 'orange' });
      } else {
        await publishMutation.mutateAsync({ id: item.id, expected_updated_at: ts });
        notifications.show({ title: 'Xuất bản thành công', message: 'Nội dung đã được xuất bản công khai', color: 'green' });
      }
      refetch();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Không thể thay đổi trạng thái xuất bản';
      notifications.show({ title: 'Lỗi thao tác', message: msg, color: 'red' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePublish = () => {
    if (isPublished) {
      void handleDoPublish();
      return;
    }
    const errs: { title?: string; slug?: string; cover?: string; alt?: string; youtube?: string; content?: string; excerpt?: string } = {};
    if (!title.trim()) {
      errs.title = 'Tiêu đề không được để trống';
    } else if (title.length > NEWS_TITLE_MAX_LENGTH) {
      errs.title = `Tiêu đề vượt quá ${title.length - NEWS_TITLE_MAX_LENGTH} ký tự cho phép`;
    }

    if (excerpt.length > NEWS_EXCERPT_MAX_LENGTH) {
      errs.excerpt = `Tóm tắt nội dung vượt quá ${excerpt.length - NEWS_EXCERPT_MAX_LENGTH} ký tự cho phép`;
    }

    if (item.type === 'article') {
      if (!slug.trim()) errs.slug = 'Đường dẫn tĩnh không được để trống khi xuất bản';
      else if (slug.length > NEWS_SLUG_MAX_LENGTH) errs.slug = `Đường dẫn tĩnh vượt quá ${slug.length - NEWS_SLUG_MAX_LENGTH} ký tự cho phép`;

      const hasCover = Boolean(coverFile) || Boolean(coverUrl.trim()) || Boolean(item.cover_image_url);
      if (!hasCover) errs.cover = 'Bài viết xuất bản bắt buộc phải có ảnh bìa';
      if (!coverAlt.trim()) errs.alt = 'Bài viết xuất bản bắt buộc phải có mô tả ảnh bìa';
      if (!contentJson) errs.content = 'Nội dung bài viết không được để trống';
    } else if (item.type === 'video') {
      if (!youtubeVideoId) errs.youtube = 'Video xuất bản bắt buộc phải có ID hoặc URL YouTube hợp lệ';
    }
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      notifications.show({ title: 'Thiếu thông tin xuất bản', message: 'Vui lòng kiểm tra các trường bị báo đỏ', color: 'red' });
      return;
    }
    setErrors({});
    if (isDirty) {
      setShowUnsavedModal(true);
      return;
    }
    void handleDoPublish();
  };

  const handleConfirmSaveAndPublish = async () => {
    setShowUnsavedModal(false);
    const newUpdatedAt = await handleSaveInternal();
    if (newUpdatedAt) await handleDoPublish(newUpdatedAt);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      <Modal opened={showUnsavedModal} onClose={() => setShowUnsavedModal(false)} title="Bạn có thay đổi chưa lưu" centered>
        <Text size="sm" mb="lg">Lưu các thay đổi và xuất bản ngay không? Bấm Hủy để kiểm tra lại.</Text>
        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={() => setShowUnsavedModal(false)}>Hủy</Button>
          <Button color="teal" loading={isSubmitting} onClick={handleConfirmSaveAndPublish}>Lưu và Xuất bản</Button>
        </Group>
      </Modal>

      <Group justify="space-between" align="center" wrap="wrap" gap="sm">
        <Button component={Link} href="/writer" variant="subtle" color="gray" leftSection={<ArrowLeft size={16} />} size="sm">
          Quay lại danh sách
        </Button>
        <Group gap="xs" align="center">
          {item.updated_at && (
            <Text size="xs" c="dimmed" className="hidden sm:inline-block">
              Cập nhật: {formatDate(item.updated_at)}
            </Text>
          )}
          {isDirty && (
            <Badge color="orange" size="sm" variant="light">
              Có thay đổi chưa lưu
            </Badge>
          )}
          {isPublished && item.type === 'article' && item.slug && (
            <Button
              component={Link}
              href={`/news/${item.slug}`}
              target="_blank"
              variant="default"
              size="sm"
              radius="md"
              leftSection={<ExternalLink size={14} />}
            >
              Xem trực tiếp
            </Button>
          )}
          <Badge color={item.type === 'video' ? 'red' : 'blue'} size="lg" variant="light">
            {item.type === 'video' ? 'Video' : 'Bài viết'}
          </Badge>
          <Badge color={isPublished ? 'teal' : 'gray'} size="lg" variant="filled">
            {isPublished ? 'Đã xuất bản' : 'Bản nháp'}
          </Badge>
        </Group>
      </Group>

      <form className="w-full" onSubmit={handleSave} onKeyDown={(e) => { if (e.key === 'Enter' && (e.target as HTMLElement)?.tagName === 'INPUT') e.preventDefault(); }}>
        <Card withBorder radius="xl" padding="lg" className="w-full space-y-6 bg-surface-app border-border-app">
          {/* Title with Character Limit and Red Warning */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Text size="sm" fw={500} className="text-text-app">
                Tiêu đề <span className="text-red-500">*</span>
              </Text>
              <Text
                size="xs"
                fw={isTitleOverLimit ? 600 : 400}
                c={isTitleOverLimit ? 'red' : title.length > 180 ? 'orange' : 'dimmed'}
              >
                {title.length}/{NEWS_TITLE_MAX_LENGTH} ký tự
              </Text>
            </div>
            <TextInput
              placeholder="Nhập tiêu đề bài viết hoặc video..."
              value={title}
              onChange={(e) => {
                const val = e.currentTarget.value;
                setTitle(val);
                if (val.length > NEWS_TITLE_MAX_LENGTH) {
                  setErrors((p) => ({
                    ...p,
                    title: `Tiêu đề vượt quá ${val.length - NEWS_TITLE_MAX_LENGTH} ký tự cho phép`,
                  }));
                } else {
                  setErrors((p) => ({ ...p, title: undefined }));
                }
              }}
              required
              error={
                errors.title ||
                (isTitleOverLimit ? `Tiêu đề vượt quá ${title.length - NEWS_TITLE_MAX_LENGTH} ký tự cho phép` : undefined)
              }
            />
          </div>

          {/* Category & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Chuyên mục"
              description="Chọn chuyên mục chính cho bài viết"
              data={NEWS_CATEGORIES.map((c) => ({ value: c.slug, label: c.name }))}
              value={category}
              onChange={(val) => setCategory(val || 'khoi-nghiep')}
              required
              withAsterisk
              radius="md"
            />
            <TagsInput
              label="Chủ đề và thẻ"
              description="Nhấn Enter để thêm thẻ, ví dụ KhởiNghiệp, AI, PMF"
              placeholder="Thêm thẻ..."
              value={tags}
              onChange={setTags}
              maxTags={10}
              radius="md"
            />
          </div>

          {/* Excerpt with Character Limit and Red Highlight Alert */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Text size="sm" fw={500} className="text-text-app">
                Tóm tắt nội dung
              </Text>
              <Text
                size="xs"
                fw={isExcerptOverLimit ? 600 : 400}
                c={isExcerptOverLimit ? 'red' : excerpt.length > 280 ? 'orange' : 'dimmed'}
              >
                {excerpt.length}/{NEWS_EXCERPT_MAX_LENGTH} ký tự
              </Text>
            </div>
            <Textarea
              placeholder="Mô tả ngắn gọn hiển thị trên thẻ xem trước..."
              value={excerpt}
              onChange={(e) => {
                const val = e.currentTarget.value;
                setExcerpt(val);
                if (val.length > NEWS_EXCERPT_MAX_LENGTH) {
                  setErrors((p) => ({
                    ...p,
                    excerpt: `Tóm tắt nội dung vượt quá ${val.length - NEWS_EXCERPT_MAX_LENGTH} ký tự cho phép`,
                  }));
                } else {
                  setErrors((p) => ({ ...p, excerpt: undefined }));
                }
              }}
              error={
                errors.excerpt ||
                (isExcerptOverLimit ? `Tóm tắt nội dung vượt quá ${excerpt.length - NEWS_EXCERPT_MAX_LENGTH} ký tự cho phép` : undefined)
              }
              rows={3}
            />
          </div>

          {item.type === 'article' ? (
            <Stack gap="md">
              {/* Slug with character count and limit alert */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Text size="sm" fw={500} className="text-text-app">
                    Đường dẫn tĩnh <span className="text-red-500">*</span>
                  </Text>
                  {!isPublished && (
                    <Text
                      size="xs"
                      fw={isSlugOverLimit ? 600 : 400}
                      c={isSlugOverLimit ? 'red' : slug.length > 140 ? 'orange' : 'dimmed'}
                    >
                      {slug.length}/{NEWS_SLUG_MAX_LENGTH} ký tự
                    </Text>
                  )}
                </div>
                <TextInput
                  description={isPublished ? 'Bài viết đã xuất bản, đường dẫn đã cố định' : 'Đường dẫn định danh bài viết'}
                  value={slug}
                  disabled={isPublished}
                  onChange={(e) => {
                    const val = e.currentTarget.value;
                    setSlug(val);
                    if (val.length > NEWS_SLUG_MAX_LENGTH) {
                      setErrors((p) => ({
                        ...p,
                        slug: `Đường dẫn tĩnh vượt quá ${val.length - NEWS_SLUG_MAX_LENGTH} ký tự cho phép`,
                      }));
                    } else {
                      setErrors((p) => ({ ...p, slug: undefined }));
                    }
                  }}
                  error={
                    errors.slug ||
                    (isSlugOverLimit ? `Đường dẫn tĩnh vượt quá ${slug.length - NEWS_SLUG_MAX_LENGTH} ký tự cho phép` : undefined)
                  }
                />
              </div>

              <ArticleCoverSection
                file={coverFile}
                onFileChange={(f) => { setCoverFile(f); setErrors((p) => ({ ...p, cover: undefined })); }}
                url={coverUrl}
                onUrlChange={(u) => { setCoverUrl(u); setErrors((p) => ({ ...p, cover: undefined })); }}
                alt={coverAlt}
                onAltChange={(a) => { setCoverAlt(a); setErrors((p) => ({ ...p, alt: undefined })); }}
                existingUrl={item.cover_image_url}
                fileError={errors.cover}
                altError={errors.alt}
                required
              />
              <div>
                <Text size="sm" fw={600} mb={2} className="text-text-app">
                  Nội dung chi tiết <span className="text-red-500">*</span>
                </Text>
                <Text size="xs" c="dimmed" mb="xs">
                  Soạn thảo bài viết trực tiếp gồm tiêu đề, in đậm, danh sách và liên kết.
                </Text>
                <NewsRichTextEditor
                  content={contentJson}
                  onChange={(c) => { setContentJson(c); setErrors((p) => ({ ...p, content: undefined })); }}
                  error={errors.content}
                />
              </div>
            </Stack>
          ) : (
            <YouTubePreviewSection
              value={youtubeUrl}
              onChange={(v) => { setYoutubeUrl(v); setErrors((p) => ({ ...p, youtube: undefined })); }}
              videoId={youtubeVideoId}
              error={errors.youtube}
            />
          )}

          <Group justify="space-between" pt="md" className="border-t border-border-app">
            <Button
              type="button"
              variant="light"
              color={isPublished ? 'orange' : 'teal'}
              onClick={handleTogglePublish}
              loading={isSubmitting}
              leftSection={isPublished ? <Undo2 size={16} /> : <Send size={16} />}
            >
              {isPublished ? 'Hủy xuất bản' : 'Xuất bản'}
            </Button>
            <Button
              type="submit"
              color="brand"
              size="md"
              radius="md"
              loading={isSubmitting}
              leftSection={<Save size={18} />}
            >
              Lưu thay đổi
            </Button>
          </Group>
        </Card>
      </form>
    </div>
  );
}
