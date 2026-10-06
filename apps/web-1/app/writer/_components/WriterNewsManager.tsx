'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Button, Select, Text, Pagination, TextInput, Tabs, Paper, ThemeIcon } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { Plus, Search, X, ExternalLink, FileText, CheckCircle2, Clock, Video, PenSquare, Sparkles } from 'lucide-react';
import {
  useAdminNewsList,
  usePublishNewsItem,
  useUnpublishNewsItem,
  useDeleteNewsItem,
} from '@/app/admin/hooks/useAdminNews';
import { NewsTable } from '@/app/admin/_components/news/NewsTable';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import { NEWS_CATEGORIES, type NewsItemAdmin } from '@repo/validation';
import { useSession } from '@/lib/auth-client';

export function WriterNewsManager() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const [activeTab, setActiveTab] = useState<string | null>('all');
  const [page, setPage] = useState(1);
  const [type, setType] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<string | null>('newest');
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 300);

  const { data, isLoading, isError } = useAdminNewsList({
    page,
    limit: 15,
    type: type === 'article' || type === 'video' ? type : undefined,
    status: status === 'draft' || status === 'published' ? status : undefined,
    category: category || undefined,
    sort: sort === 'oldest' ? 'oldest' : 'newest',
    search: debouncedSearch.trim() || undefined,
  });

  const publishMutation = usePublishNewsItem();
  const unpublishMutation = useUnpublishNewsItem();
  const deleteMutation = useDeleteNewsItem();

  const handlePublish = async (item: NewsItemAdmin) => {
    if (item.type === 'article' && (!item.cover_image_url || !item.cover_image_alt?.trim())) {
      notifications.show({
        title: 'Thiếu thông tin xuất bản',
        message: 'Bài viết chưa có ảnh bìa hoặc mô tả ảnh bìa. Vui lòng vào chỉnh sửa bài viết để bổ sung trước khi xuất bản.',
        color: 'red',
      });
      return;
    }
    try {
      await publishMutation.mutateAsync({
        id: item.id,
        expected_updated_at: item.updated_at,
      });
      notifications.show({
        title: 'Xuất bản thành công',
        message: `Đã xuất bản bài viết "${item.title}"`,
        color: 'green',
      });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Không thể xuất bản bài viết. Vui lòng kiểm tra lại.';
      notifications.show({
        title: 'Lỗi xuất bản',
        message: msg,
        color: 'red',
      });
    }
  };

  const handleUnpublish = async (item: NewsItemAdmin) => {
    try {
      await unpublishMutation.mutateAsync({
        id: item.id,
        expected_updated_at: item.updated_at,
      });
      notifications.show({
        title: 'Đã hủy xuất bản',
        message: `Bài viết "${item.title}" đã chuyển về bản nháp`,
        color: 'orange',
      });
    } catch {
      notifications.show({
        title: 'Lỗi hủy xuất bản',
        message: 'Không thể hủy xuất bản bài viết.',
        color: 'red',
      });
    }
  };

  const handleDelete = async (item: NewsItemAdmin) => {
    try {
      await deleteMutation.mutateAsync({
        id: item.id,
        expected_updated_at: item.updated_at,
      });
      notifications.show({
        title: 'Xóa thành công',
        message: `Đã xóa bài viết "${item.title}"`,
        color: 'green',
      });
    } catch {
      notifications.show({
        title: 'Lỗi xóa bài',
        message: 'Không thể xóa bài viết.',
        color: 'red',
      });
    }
  };

  const isMutating =
    publishMutation.isPending || unpublishMutation.isPending || deleteMutation.isPending;

  // Lọc items theo tab "Bài viết của tôi" nếu chọn tab "my"
  const displayedItems = useMemo(() => {
    if (!data?.items) return [];
    if (activeTab === 'my' && currentUserId) {
      return data.items.filter((item) => item.created_by_auth_user_id === currentUserId);
    }
    return data.items;
  }, [data?.items, activeTab, currentUserId]);

  // Thống kê nhanh
  const stats = useMemo(() => {
    const items = data?.items || [];
    return {
      total: data?.total || 0,
      published: items.filter((i) => i.status === 'published').length,
      draft: items.filter((i) => i.status === 'draft').length,
      video: items.filter((i) => i.type === 'video').length,
      myItems: currentUserId ? items.filter((i) => i.created_by_auth_user_id === currentUserId).length : 0,
    };
  }, [data, currentUserId]);

  return (
    <div className="space-y-6">
      {/* KPI Cards cho Writer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Paper p="md" radius="md" withBorder className="bg-surface-app border-border-app">
          <div className="flex items-center justify-between">
            <div>
              <Text size="xs" c="dimmed" fw={500}>Tổng nội dung</Text>
              <Text size="xl" fw={700} className="text-text-app mt-1">{stats.total}</Text>
            </div>
            <ThemeIcon color="blue" variant="light" size="lg" radius="md">
              <FileText size={20} />
            </ThemeIcon>
          </div>
        </Paper>

        <Paper p="md" radius="md" withBorder className="bg-surface-app border-border-app">
          <div className="flex items-center justify-between">
            <div>
              <Text size="xs" c="dimmed" fw={500}>Đã xuất bản</Text>
              <Text size="xl" fw={700} className="text-teal-600 dark:text-teal-400 mt-1">{stats.published}</Text>
            </div>
            <ThemeIcon color="teal" variant="light" size="lg" radius="md">
              <CheckCircle2 size={20} />
            </ThemeIcon>
          </div>
        </Paper>

        <Paper p="md" radius="md" withBorder className="bg-surface-app border-border-app">
          <div className="flex items-center justify-between">
            <div>
              <Text size="xs" c="dimmed" fw={500}>Bản nháp</Text>
              <Text size="xl" fw={700} className="text-yellow-600 dark:text-yellow-400 mt-1">{stats.draft}</Text>
            </div>
            <ThemeIcon color="yellow" variant="light" size="lg" radius="md">
              <Clock size={20} />
            </ThemeIcon>
          </div>
        </Paper>

        <Paper p="md" radius="md" withBorder className="bg-surface-app border-border-app">
          <div className="flex items-center justify-between">
            <div>
              <Text size="xs" c="dimmed" fw={500}>Video chia sẻ</Text>
              <Text size="xl" fw={700} className="text-red-600 dark:text-red-400 mt-1">{stats.video}</Text>
            </div>
            <ThemeIcon color="red" variant="light" size="lg" radius="md">
              <Video size={20} />
            </ThemeIcon>
          </div>
        </Paper>
      </div>

      {/* Tabs & Action row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-app pb-3">
        <Tabs value={activeTab} onChange={setActiveTab} variant="pills" radius="md">
          <Tabs.List>
            <Tabs.Tab value="all" leftSection={<FileText size={15} />}>
              Tất cả nội dung
            </Tabs.Tab>
            <Tabs.Tab value="my" leftSection={<PenSquare size={15} />}>
              Nội dung của tôi ({stats.myItems})
            </Tabs.Tab>
          </Tabs.List>
        </Tabs>

        <div className="flex items-center gap-2.5">
          <Button
            component={Link}
            href="/news"
            target="_blank"
            variant="default"
            size="sm"
            radius="md"
            leftSection={<ExternalLink size={15} />}
          >
            Xem trang tin tức
          </Button>
          <Button
            component={Link}
            href="/writer/news/new"
            color="brand"
            size="sm"
            radius="md"
            leftSection={<Plus size={16} />}
          >
            Tạo nội dung mới
          </Button>
        </div>
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-3">
        <TextInput
          placeholder="Tìm theo tiêu đề bài viết, video..."
          leftSection={<Search size={16} className="text-text-muted" />}
          rightSection={
            search ? (
              <button
                type="button"
                onClick={() => { setSearch(''); setPage(1); }}
                className="text-text-muted hover:text-text-app p-1 cursor-pointer"
                aria-label="Xóa tìm kiếm"
              >
                <X size={14} />
              </button>
            ) : null
          }
          value={search}
          onChange={(e) => {
            setSearch(e.currentTarget.value);
            setPage(1);
          }}
          radius="md"
          className="w-full sm:w-72 md:w-80 lg:w-96"
        />
        <Select
          placeholder="Loại nội dung"
          data={[{ value: '', label: 'Tất cả loại' }, { value: 'article', label: 'Bài viết' }, { value: 'video', label: 'Video' }]}
          value={type ?? ''}
          onChange={(val) => { setType(val || null); setPage(1); }}
          clearable
          radius="md"
          style={{ width: 160 }}
        />
        <Select
          placeholder="Chuyên mục"
          data={[
            { value: '', label: 'Tất cả chuyên mục' },
            ...NEWS_CATEGORIES.map((c) => ({ value: c.slug, label: c.name })),
          ]}
          value={category ?? ''}
          onChange={(val) => { setCategory(val || null); setPage(1); }}
          searchable
          clearable
          radius="md"
          style={{ width: 220 }}
        />
        <Select
          placeholder="Trạng thái"
          data={[{ value: '', label: 'Tất cả trạng thái' }, { value: 'draft', label: 'Bản nháp' }, { value: 'published', label: 'Đã xuất bản' }]}
          value={status ?? ''}
          onChange={(val) => { setStatus(val || null); setPage(1); }}
          clearable
          radius="md"
          style={{ width: 160 }}
        />
        <Select
          placeholder="Sắp xếp"
          data={[{ value: 'newest', label: 'Mới nhất' }, { value: 'oldest', label: 'Cũ nhất' }]}
          value={sort ?? 'newest'}
          onChange={(val) => { setSort(val || 'newest'); setPage(1); }}
          radius="md"
          style={{ width: 130 }}
        />
      </div>

      {/* Main content table */}
      {isLoading ? (
        <LoadingSkeleton variant="table-row" count={5} />
      ) : isError ? (
        <Paper p="xl" radius="md" withBorder className="text-center py-12">
          <Text c="red" mb="sm" fw={600}>Không thể tải danh sách bài viết</Text>
          <Text size="sm" c="dimmed">Đã xảy ra lỗi khi kết nối với máy chủ. Vui lòng tải lại trang.</Text>
        </Paper>
      ) : displayedItems.length === 0 ? (
        <Paper p="xl" radius="md" withBorder className="text-center py-16 bg-surface-soft/40 border-dashed border-border-app">
          <div className="flex flex-col items-center justify-center gap-3 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-full bg-brand-soft flex items-center justify-center text-brand">
              <Sparkles size={24} />
            </div>
            <Text fw={600} size="md" className="text-text-app">
              {activeTab === 'my' ? 'Bạn chưa có bài viết nào' : 'Chưa có bài viết nào phù hợp'}
            </Text>
            <Text size="sm" c="dimmed" className="text-center">
              {activeTab === 'my'
                ? 'Hãy bắt đầu chia sẻ ý tưởng khởi nghiệp, kiến thức công nghệ hoặc bài học kinh nghiệm đầu tiên của bạn.'
                : 'Thử điều chỉnh lại bộ lọc hoặc từ khóa tìm kiếm để xem các nội dung khác.'}
            </Text>
            <Button
              component={Link}
              href="/writer/news/new"
              color="brand"
              size="sm"
              radius="md"
              leftSection={<Plus size={16} />}
              className="mt-2"
            >
              Viết bài mới ngay
            </Button>
          </div>
        </Paper>
      ) : (
        <NewsTable
          items={displayedItems}
          onPublish={handlePublish}
          onUnpublish={handleUnpublish}
          onDelete={handleDelete}
          isActionLoading={isMutating}
          basePath="/writer/news"
        />
      )}

      {/* Pagination */}
      {data && data.total_pages > 1 && (
        <div className="flex justify-center pt-2">
          <Pagination
            total={data.total_pages}
            value={page}
            onChange={setPage}
            color="brand"
            radius="md"
          />
        </div>
      )}
    </div>
  );
}
