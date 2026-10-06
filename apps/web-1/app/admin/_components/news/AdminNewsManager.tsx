'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button, Group, Select, Text, Pagination, TextInput } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { Plus, Search, X } from 'lucide-react';
import {
  useAdminNewsList,
  usePublishNewsItem,
  useUnpublishNewsItem,
  useDeleteNewsItem,
} from '../../hooks/useAdminNews';
import { NewsTable } from './NewsTable';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import { NEWS_CATEGORIES, type NewsItemAdmin } from '@repo/validation';

export function AdminNewsManager() {
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

  return (
    <div className="space-y-4">
      {/* Top action row */}
      <div className="flex items-center justify-end">
        <Button
          component={Link}
          href="/admin/news/new"
          color="brand"
          size="sm"
          radius="md"
          leftSection={<Plus size={16} />}
        >
          Tạo nội dung
        </Button>
      </div>

      {/* Filter row: search bar dài hơn + toàn bộ selectbox dồn hết sang bên trái */}
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
          clearable
          radius="md"
          style={{ width: 180 }}
        />
        <Select
          placeholder="Trạng thái"
          data={[{ value: '', label: 'Tất cả trạng thái' }, { value: 'draft', label: 'Bản nháp' }, { value: 'published', label: 'Đã xuất bản' }]}
          value={status ?? ''}
          onChange={(val) => { setStatus(val || null); setPage(1); }}
          clearable
          radius="md"
          style={{ width: 170 }}
        />
        <Select
          placeholder="Sắp xếp"
          data={[{ value: 'newest', label: 'Mới cập nhật' }, { value: 'oldest', label: 'Cũ nhất' }]}
          value={sort ?? 'newest'}
          onChange={(val) => setSort(val || 'newest')}
          radius="md"
          style={{ width: 160 }}
        />
      </div>

      {/* Main Table */}
      {isLoading ? (
        <LoadingSkeleton variant="table-row" count={4} />
      ) : isError ? (
        <div className="p-4 bg-danger-soft border border-danger/20 text-danger rounded-xl text-sm">
          Không thể tải danh sách tin tức. Vui lòng kiểm tra lại.
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="text-center py-12 border border-border-app rounded-xl bg-surface-app">
          <Text size="sm" c="dimmed">
            Chưa có mục tin tức nào theo bộ lọc đã chọn.
          </Text>
        </div>
      ) : (
        <>
          <NewsTable
            items={data.items}
            onPublish={handlePublish}
            onUnpublish={handleUnpublish}
            onDelete={handleDelete}
            isActionLoading={isMutating}
          />

          {data.total_pages > 1 && (
            <Group justify="flex-end" mt="md">
              <Pagination
                value={page}
                onChange={setPage}
                total={data.total_pages}
                size="sm"
                radius="md"
              />
            </Group>
          )}
        </>
      )}
    </div>
  );
}
