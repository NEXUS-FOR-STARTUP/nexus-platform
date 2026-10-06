'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Group, SegmentedControl, Stack, Text, TextInput, Textarea, Title, Select, TagsInput, Modal } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { ArrowLeft, Save, Send } from 'lucide-react';
import { useCreateNewsItem, useUploadNewsCover, usePublishNewsItem } from '@/app/admin/hooks/useAdminNews';
import { NewsRichTextEditor } from '@/app/admin/_components/news/NewsRichTextEditor';
import { YouTubePreviewSection, ArticleCoverSection } from '@/app/admin/_components/news/NewsEditorFormSections';
import {
  NEWS_CATEGORIES,
  NEWS_EXCERPT_MAX_LENGTH,
  NEWS_TITLE_MAX_LENGTH,
  NEWS_SLUG_MAX_LENGTH,
  generateNewsSlug,
  extractYouTubeVideoId,
} from '@repo/validation';

export default function NewWriterNewsItemPage() {
  const router = useRouter();
  const createMutation = useCreateNewsItem();
  const uploadCoverMutation = useUploadNewsCover();
  const publishMutation = usePublishNewsItem();

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
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [errors, setErrors] = useState<{
    title?: string;
    slug?: string;
    excerpt?: string;
    youtube?: string;
    cover?: string;
    alt?: string;
    content?: string;
  }>({});

  const isTitleOverLimit = title.length > NEWS_TITLE_MAX_LENGTH;
  const isExcerptOverLimit = excerpt.length > NEWS_EXCERPT_MAX_LENGTH;
  const isSlugOverLimit = slug.length > NEWS_SLUG_MAX_LENGTH;

  const isFormTouched = Boolean(title.trim() || excerpt.trim() || coverFile || coverUrl.trim() || youtubeUrl.trim());

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slugCustomized && type === 'article') {
      setSlug(generateNewsSlug(val));
    }
    if (val.length > NEWS_TITLE_MAX_LENGTH) {
      setErrors((p) => ({
        ...p,
        title: `Tiêu đề vượt quá ${val.length - NEWS_TITLE_MAX_LENGTH} ký tự cho phép`,
      }));
    } else {
      setErrors((p) => ({ ...p, title: undefined }));
    }
  };

  const youtubeVideoId = type === 'video' ? extractYouTubeVideoId(youtubeUrl) : null;

  const validateCommon = () => {
    const errs: { title?: string; slug?: string; excerpt?: string; youtube?: string } = {};
    if (!title.trim()) {
      errs.title = 'Vui lòng nhập tiêu đề';
    } else if (title.length > NEWS_TITLE_MAX_LENGTH) {
      errs.title = `Tiêu đề vượt quá ${title.length - NEWS_TITLE_MAX_LENGTH} ký tự cho phép`;
    }

    if (excerpt.length > NEWS_EXCERPT_MAX_LENGTH) {
      errs.excerpt = `Tóm tắt nội dung vượt quá ${excerpt.length - NEWS_EXCERPT_MAX_LENGTH} ký tự cho phép`;
    }

    if (type === 'article' && slug.length > NEWS_SLUG_MAX_LENGTH) {
      errs.slug = `Đường dẫn tĩnh vượt quá ${slug.length - NEWS_SLUG_MAX_LENGTH} ký tự cho phép`;
    }

    if (type === 'video' && !youtubeVideoId) {
      errs.youtube = 'Vui lòng nhập đường dẫn YouTube hợp lệ';
    }

    return errs;
  };

  // 1. Lưu nháp: Bấm là lưu ngay, không mở modal confirm
  const handleSaveDraft = async () => {
    const errs = validateCommon();
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
            message: 'Tạo bản nháp thành công nhưng ảnh bìa chưa được tải lên.',
            color: 'yellow',
          });
        }
      }

      notifications.show({ title: 'Thành công', message: 'Đã lưu bản nháp thành công', color: 'green' });
      router.push(`/writer/news/${created.id}`);
    } catch {
      notifications.show({ title: 'Lỗi tạo nội dung', message: 'Không thể tạo bản nháp. Vui lòng kiểm tra lại.', color: 'red' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Xuất bản: Validate bắt buộc -> Mở modal confirm
  const handleOpenPublishModal = () => {
    const errs: { title?: string; slug?: string; excerpt?: string; youtube?: string; cover?: string; alt?: string; content?: string } = {
      ...validateCommon(),
    };

    if (type === 'article') {
      if (!slug.trim()) errs.slug = 'Đường dẫn tĩnh không được để trống khi xuất bản';
      const hasCover = Boolean(coverFile) || Boolean(coverUrl.trim());
      if (!hasCover) errs.cover = 'Bài viết xuất bản bắt buộc phải có ảnh bìa';
      if (!coverAlt.trim()) errs.alt = 'Bài viết xuất bản bắt buộc phải có mô tả ảnh bìa';
      if (!contentJson) errs.content = 'Nội dung bài viết không được để trống';
    } else if (type === 'video') {
      if (!youtubeVideoId) errs.youtube = 'Video xuất bản bắt buộc phải có URL hoặc ID YouTube hợp lệ';
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      notifications.show({ title: 'Thiếu thông tin xuất bản', message: 'Vui lòng bổ sung các trường bắt buộc', color: 'red' });
      return;
    }

    setErrors({});
    setShowPublishModal(true);
  };

  const handleConfirmPublish = async () => {
    setShowPublishModal(false);
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

      let latestUpdatedAt = created.updated_at;
      if (type === 'article' && coverFile && created.id) {
        const withCover = await uploadCoverMutation.mutateAsync({
          id: created.id,
          file: coverFile,
          expected_updated_at: created.updated_at,
        });
        latestUpdatedAt = withCover.updated_at;
      }

      await publishMutation.mutateAsync({
        id: created.id,
        expected_updated_at: latestUpdatedAt,
      });

      notifications.show({ title: 'Thành công', message: 'Nội dung đã được tạo và xuất bản công khai!', color: 'green' });
      router.push(`/writer/news/${created.id}`);
    } catch {
      notifications.show({ title: 'Lỗi xuất bản', message: 'Không thể xuất bản nội dung. Vui lòng kiểm tra lại.', color: 'red' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (isFormTouched) {
      setShowCancelModal(true);
    } else {
      router.push('/writer');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      {/* Modal xác nhận xuất bản */}
      <Modal opened={showPublishModal} onClose={() => setShowPublishModal(false)} title="Xác nhận xuất bản bài viết" centered>
        <Text size="sm" mb="lg">
          Bài viết này sẽ được xuất bản công khai ngay lập tức lên trang tin tức của hệ thống. Bạn có chắc chắn muốn xuất bản?
        </Text>
        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={() => setShowPublishModal(false)}>Hủy</Button>
          <Button color="teal" loading={isSubmitting} onClick={handleConfirmPublish}>Xác nhận xuất bản</Button>
        </Group>
      </Modal>

      {/* Modal xác nhận hủy bỏ soạn thảo */}
      <Modal opened={showCancelModal} onClose={() => setShowCancelModal(false)} title="Xác nhận hủy soạn thảo" centered>
        <Text size="sm" mb="lg">
          Nội dung đang soạn chưa được lưu vào hệ thống. Bạn có chắc chắn muốn hủy bỏ và quay lại danh sách?
        </Text>
        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={() => setShowCancelModal(false)}>Tiếp tục soạn</Button>
          <Button color="red" onClick={() => router.push('/writer')}>Đồng ý rời đi</Button>
        </Group>
      </Modal>

      <Group justify="space-between" align="center">
        <Button onClick={handleCancel} variant="subtle" color="gray" leftSection={<ArrowLeft size={16} />} size="sm">
          Quay lại danh sách
        </Button>
        <Title order={3} className="text-xl font-bold text-text-app">
          Tạo nội dung mới
        </Title>
      </Group>

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
            onChange={(e) => handleTitleChange(e.currentTarget.value)}
            error={
              errors.title ||
              (isTitleOverLimit ? `Tiêu đề vượt quá ${title.length - NEWS_TITLE_MAX_LENGTH} ký tự cho phép` : undefined)
            }
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Chuyên mục"
            description="Chọn chuyên mục chính cho bài viết"
            data={NEWS_CATEGORIES.map((c) => ({ value: c.slug, label: c.name }))}
            value={category}
            onChange={(val) => setCategory(val || 'khoi-nghiep')}
            searchable
            radius="md"
            required
            withAsterisk
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

        {/* Excerpt with Character Limit and Red Warning */}
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

        {type === 'article' ? (
          <Stack gap="md">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Text size="sm" fw={500} className="text-text-app">
                  Đường dẫn tĩnh <span className="text-red-500">*</span>
                </Text>
                <Text
                  size="xs"
                  fw={isSlugOverLimit ? 600 : 400}
                  c={isSlugOverLimit ? 'red' : slug.length > 140 ? 'orange' : 'dimmed'}
                >
                  {slug.length}/{NEWS_SLUG_MAX_LENGTH} ký tự
                </Text>
              </div>
              <TextInput
                description="Tự động tạo từ tiêu đề. Có thể chỉnh sửa thủ công."
                placeholder="duong-dan-bai-viet"
                value={slug}
                onChange={(e) => {
                  const val = e.currentTarget.value;
                  setSlug(val);
                  setSlugCustomized(true);
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

        {/* Thanh thao tác đáy trang: Hủy bỏ bên trái | Lưu nháp & Xuất bản bên phải */}
        <Group justify="space-between" pt="md" className="border-t border-border-app">
          <Button
            type="button"
            variant="subtle"
            color="gray"
            onClick={handleCancel}
          >
            Hủy bỏ
          </Button>

          <Group gap="sm">
            <Button
              type="button"
              variant="default"
              size="md"
              radius="md"
              loading={isSubmitting}
              onClick={handleSaveDraft}
              leftSection={<Save size={18} />}
            >
              Lưu nháp
            </Button>
            <Button
              type="button"
              color="teal"
              size="md"
              radius="md"
              loading={isSubmitting}
              onClick={handleOpenPublishModal}
              leftSection={<Send size={18} />}
            >
              Xuất bản
            </Button>
          </Group>
        </Group>
      </Card>
    </div>
  );
}
