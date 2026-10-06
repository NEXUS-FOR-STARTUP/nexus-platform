'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Button, Card, Group, Stack, Text, TextInput, Textarea, Badge, Modal, Select, TagsInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { ArrowLeft, Save, Send, Undo2 } from 'lucide-react';
import { useAdminNewsDetail, useUpdateNewsItem, usePublishNewsItem, useUnpublishNewsItem, useUploadNewsCover } from '@/app/admin/hooks/useAdminNews';
import { NewsRichTextEditor } from '@/app/admin/_components/news/NewsRichTextEditor';
import { YouTubePreviewSection, ArticleCoverSection } from '@/app/admin/_components/news/NewsEditorFormSections';
import { NEWS_CATEGORIES, extractYouTubeVideoId } from '@repo/validation';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';

export default function EditNewsItemPage({ params }: { params: Promise<{ id: string }> }) {
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
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; slug?: string; cover?: string; alt?: string; youtube?: string; content?: string }>({});
  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setSlug(item.slug || '');
      setCategory(item.category || 'khoi-nghiep');
      setTags(item.tags || []);
      setExcerpt(item.excerpt || '');
      setContentJson(item.content_json || { type: 'doc', content: [{ type: 'paragraph' }] });
      setYoutubeUrl(item.youtube_video_id ? `https://www.youtube.com/watch?v=${item.youtube_video_id}` : '');
      setCoverAlt(item.cover_image_alt || '');
      setErrors({});
    }
  }, [item]);

  if (isLoading) return <div className="max-w-4xl mx-auto p-6 space-y-4"><LoadingSkeleton variant="card" count={2} /></div>;
  if (isError || !item) return (
    <div className="max-w-4xl mx-auto p-6 text-center">
      <Text c="red" mb="md">Không tìm thấy mục tin tức hoặc đã xảy ra lỗi tải dữ liệu.</Text>
      <Button component={Link} href="/admin?tab=news" variant="default">Quay lại</Button>
    </div>
  );

  const isPublished = item.status === 'published';
  const youtubeVideoId = item.type === 'video' ? extractYouTubeVideoId(youtubeUrl) : null;

  const origYt = item.youtube_video_id ? `https://www.youtube.com/watch?v=${item.youtube_video_id}` : '';
  const isDirty = coverFile !== null || title !== item.title || excerpt !== (item.excerpt ?? '') || coverAlt !== (item.cover_image_alt ?? '')
    || category !== (item.category ?? 'khoi-nghiep')
    || JSON.stringify(tags) !== JSON.stringify(item.tags ?? [])
    || (item.type === 'article' && (slug !== (item.slug ?? '') || JSON.stringify(contentJson) !== JSON.stringify(item.content_json))) || (item.type === 'video' && youtubeUrl !== origYt);
  const handleSaveInternal = async () => {
    const errs: { title?: string; youtube?: string; cover?: string; alt?: string; content?: string } = {};
    if (!title.trim()) errs.title = 'Tiêu đề không được để trống';
    if (item.type === 'video' && !youtubeVideoId) errs.youtube = 'Vui lòng nhập URL hoặc ID video YouTube hợp lệ';
    if (isPublished && item.type === 'article') {
      if (!item.cover_image_url && !coverFile) errs.cover = 'Bài viết đã xuất bản phải có ảnh bìa';
      if (!coverAlt.trim()) errs.alt = 'Bài viết đã xuất bản phải có mô tả ảnh bìa (alt)';
      if (!contentJson) errs.content = 'Nội dung bài viết không được để trống';
    }
    if (Object.keys(errs).length > 0) { setErrors((p) => ({ ...p, ...errs })); notifications.show({ title: 'Lỗi nhập liệu', message: 'Vui lòng kiểm tra các trường bị báo đỏ', color: 'red' }); return null; }
    setIsSubmitting(true);
    try {
      let updated = await updateMutation.mutateAsync({ id: item.id, data: {
        title: title.trim(), slug: item.type === 'article' && !isPublished ? slug.trim() : undefined,
        category,
        tags,
        excerpt: excerpt.trim(), content_json: item.type === 'article' ? contentJson : undefined,
        youtube_url_or_id: item.type === 'video' ? youtubeUrl.trim() : undefined,
        cover_image_alt: item.type === 'article' ? coverAlt.trim() : undefined,
        expected_updated_at: item.updated_at,
      } });
      if (coverFile && item.type === 'article') {
        updated = await uploadCoverMutation.mutateAsync({ id: item.id, file: coverFile, expected_updated_at: updated.updated_at });
        setCoverFile(null);
      }
      notifications.show({ title: 'Thành công', message: 'Đã lưu thay đổi!', color: 'green' });
      refetch(); return updated.updated_at;
    } catch {
      notifications.show({ title: 'Lỗi lưu', message: 'Dữ liệu có thể đã bị sửa bởi người khác hoặc thông tin không hợp lệ.', color: 'red' });
      return null;
    } finally { setIsSubmitting(false); }
  };
  const handleSave = async (e: React.FormEvent) => { e.preventDefault(); await handleSaveInternal(); };

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
    } finally { setIsSubmitting(false); }
  };

  const handleTogglePublish = () => {
    if (isPublished) { void handleDoPublish(); return; }
    const errs: { title?: string; slug?: string; cover?: string; alt?: string; youtube?: string; content?: string } = {};
    if (!title.trim()) errs.title = 'Tiêu đề không được để trống';
    if (item.type === 'article') {
      if (!slug.trim()) errs.slug = 'Đường dẫn (slug) không được để trống khi xuất bản';
      if (!item.cover_image_url && !coverFile) errs.cover = 'Bài viết xuất bản bắt buộc phải có ảnh bìa';
      if (!coverAlt.trim()) errs.alt = 'Bài viết xuất bản bắt buộc phải có mô tả ảnh bìa (alt)';
      if (!contentJson) errs.content = 'Nội dung bài viết không được để trống';
    } else if (item.type === 'video') {
      if (!youtubeVideoId) errs.youtube = 'Video xuất bản bắt buộc phải có ID/URL YouTube hợp lệ';
    }
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      notifications.show({ title: 'Thiếu thông tin xuất bản', message: 'Vui lòng điền các trường bắt buộc có đánh dấu đỏ (*)', color: 'red' });
      return;
    }
    setErrors({});
    if (isDirty) setShowUnsavedModal(true);
    else void handleDoPublish();
  };
  const handleConfirmSaveAndPublish = async () => {
    setShowUnsavedModal(false);
    const newUpdatedAt = await handleSaveInternal();
    if (newUpdatedAt) await handleDoPublish(newUpdatedAt);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      <Modal opened={showUnsavedModal} onClose={() => setShowUnsavedModal(false)} title="Bạn có thay đổi chưa lưu" centered>
        <Text size="sm" mb="lg">Lưu các thay đổi và xuất bản ngay không? Bấm &quot;Hủy&quot; để kiểm tra lại.</Text>
        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={() => setShowUnsavedModal(false)}>Hủy</Button>
          <Button color="teal" loading={isSubmitting} onClick={handleConfirmSaveAndPublish}>Lưu & Xuất bản</Button>
        </Group>
      </Modal>
      <Group justify="space-between" align="center">
        <Button component={Link} href="/admin?tab=news" variant="subtle" color="gray" leftSection={<ArrowLeft size={16} />} size="sm">Quay lại danh sách</Button>
        <Group gap="xs">
          <Badge color={item.type === 'video' ? 'red' : 'blue'} size="lg" variant="light">{item.type === 'video' ? 'Video' : 'Bài viết'}</Badge>
          <Badge color={isPublished ? 'teal' : 'gray'} size="lg" variant="filled">{isPublished ? 'Đã xuất bản' : 'Bản nháp'}</Badge>
        </Group>
      </Group>
      <form className="w-full" onSubmit={handleSave} onKeyDown={(e) => { if (e.key === 'Enter' && (e.target as HTMLElement)?.tagName === 'INPUT') e.preventDefault(); }}>
        <Card withBorder radius="xl" padding="lg" className="w-full space-y-6 bg-surface-app border-border-app">
          <TextInput label="Tiêu đề" withAsterisk value={title} onChange={(e) => { setTitle(e.currentTarget.value); setErrors((p) => ({ ...p, title: undefined })); }} required maxLength={200} error={errors.title} />

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
              label="Chủ đề / Tags"
              description="Nhấn Enter để thêm tag (vd: KhởiNghiệp, AI, PMF)"
              placeholder="Thêm tag..."
              value={tags}
              onChange={setTags}
              maxTags={10}
              radius="md"
            />
          </div>
          <Textarea label="Mô tả tóm tắt (Excerpt)" value={excerpt} onChange={(e) => setExcerpt(e.currentTarget.value)} maxLength={320} rows={3} />

          {item.type === 'article' ? (
            <Stack gap="md">
              <TextInput label="Đường dẫn tĩnh (Slug)" withAsterisk description={isPublished ? 'Bài viết đã xuất bản — đường dẫn đã cố định' : 'Đường dẫn định danh bài viết'} value={slug} disabled={isPublished} onChange={(e) => { setSlug(e.currentTarget.value); setErrors((p) => ({ ...p, slug: undefined })); }} maxLength={160} error={errors.slug} />
              <ArticleCoverSection
                file={coverFile} onFileChange={(f) => { setCoverFile(f); setErrors((p) => ({ ...p, cover: undefined })); }}
                alt={coverAlt} onAltChange={(a) => { setCoverAlt(a); setErrors((p) => ({ ...p, alt: undefined })); }}
                existingUrl={item.cover_image_url} fileError={errors.cover} altError={errors.alt} required
              />
              <div>
                <Text size="sm" fw={600} mb={2} className="text-text-app">Nội dung chi tiết <span className="text-red-500">*</span></Text>
                <Text size="xs" c="dimmed" mb="xs">Soạn thảo bài viết trực tiếp (tiêu đề H2/H3, in đậm, danh sách, liên kết).</Text>
                <NewsRichTextEditor content={contentJson} onChange={(c) => { setContentJson(c); setErrors((p) => ({ ...p, content: undefined })); }} error={errors.content} />
              </div>
            </Stack>
          ) : (
            <YouTubePreviewSection value={youtubeUrl} onChange={(v) => { setYoutubeUrl(v); setErrors((p) => ({ ...p, youtube: undefined })); }} videoId={youtubeVideoId} error={errors.youtube} />
          )}
          <Group justify="space-between" pt="md" className="border-t border-border-app">
            <Button type="button" variant="light" color={isPublished ? 'orange' : 'teal'} onClick={handleTogglePublish} loading={isSubmitting} leftSection={isPublished ? <Undo2 size={16} /> : <Send size={16} />}>
              {isPublished ? 'Hủy xuất bản' : 'Xuất bản'}
            </Button>
            <Button type="submit" color="brand" size="md" radius="md" loading={isSubmitting} leftSection={<Save size={18} />}>
              Lưu thay đổi
            </Button>
          </Group>
        </Card>
      </form>
    </div>
  );
}
