'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button, Group, Select, Text, Pagination } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Plus } from 'lucide-react';
import {
  useAdminNewsList,
  usePublishNewsItem,
  useUnpublishNewsItem,
  useDeleteNewsItem,
} from '../../hooks/useAdminNews';
import { NewsTable } from './NewsTable';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import type { NewsItemAdmin } from '@repo/validation';

export function AdminNewsManager() {
  const [page, setPage] = useState(1);
  const [type, setType] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [sort, setSort] = useState<string | null>('newest');

  const { data, isLoading, isError } = useAdminNewsList({
    page,
    limit: 15,
    type: type === 'article' || type === 'video' ? type : undefined,
    status: status === 'draft' || status === 'published' ? status : undefined,
    sort: sort === 'oldest' ? 'oldest' : 'newest',
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
      {/* Top action & filter bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Group gap="xs" wrap="wrap">
          <Select
            size="xs"
            placeholder="Loại nội dung"
            data={[{ value: '', label: 'Tất cả loại' }, { value: 'article', label: 'Bài viết' }, { value: 'video', label: 'Video' }]}
            value={type ?? ''}
            onChange={(val) => { setType(val || null); setPage(1); }}
            clearable
            className="w-32"
          />
          <Select
            size="xs"
            placeholder="Trạng thái"
            data={[{ value: '', label: 'Tất cả trạng thái' }, { value: 'draft', label: 'Bản nháp' }, { value: 'published', label: 'Đã xuất bản' }]}
            value={status ?? ''}
            onChange={(val) => { setStatus(val || null); setPage(1); }}
            clearable
            className="w-36"
          />
          <Select
            size="xs"
            data={[{ value: 'newest', label: 'Mới cập nhật' }, { value: 'oldest', label: 'Cũ nhất' }]}
            value={sort ?? 'newest'}
            onChange={(val) => setSort(val || 'newest')}
            className="w-32"
          />
        </Group>

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
