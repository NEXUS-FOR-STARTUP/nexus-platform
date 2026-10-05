import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Table, Badge, Menu, ActionIcon, Text } from '@mantine/core';
import { NewsTableModals } from './NewsTableModals';
import { MoreVertical, Edit, Send, Undo2, Trash2, Video, Newspaper } from 'lucide-react';
import type { NewsItemAdmin } from '@repo/validation';

interface NewsTableProps {
  items: NewsItemAdmin[];
  onPublish: (item: NewsItemAdmin) => Promise<void>;
  onUnpublish: (item: NewsItemAdmin) => Promise<void>;
  onDelete: (item: NewsItemAdmin) => Promise<void>;
  isActionLoading?: boolean;
}

export function NewsTable({
  items,
  onPublish,
  onUnpublish,
  onDelete,
  isActionLoading = false,
}: NewsTableProps) {
  const [deleteTarget, setDeleteTarget] = useState<NewsItemAdmin | null>(null);
  const [publishTarget, setPublishTarget] = useState<NewsItemAdmin | null>(null);
  const [unpublishTarget, setUnpublishTarget] = useState<NewsItemAdmin | null>(null);

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return '—';
    try {
      return new Date(isoString).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return '—';
    }
  };

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-border-app bg-surface-app">
        <Table verticalSpacing="sm" horizontalSpacing="md" highlightOnHover>
          <Table.Thead>
            <Table.Tr className="border-b border-border-app">
              <Table.Th style={{ width: 110 }}>Ảnh</Table.Th>
              <Table.Th>Tiêu đề</Table.Th>
              <Table.Th style={{ width: 100 }}>Loại</Table.Th>
              <Table.Th style={{ width: 120 }}>Trạng thái</Table.Th>
              <Table.Th style={{ width: 130 }}>Cập nhật</Table.Th>
              <Table.Th style={{ width: 60 }}></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {items.map((item) => {
              const isPublished = item.status === 'published';
              const thumbnailUrl =
                item.type === 'video' && item.youtube_video_id
                  ? `https://img.youtube.com/vi/${item.youtube_video_id}/hqdefault.jpg`
                  : item.cover_image_url;

              return (
                <Table.Tr key={item.id} className="border-b border-border-app/50">
                  <Table.Td>
                    <div className="relative w-24 h-[54px] rounded-md overflow-hidden bg-surface-soft border border-border-app shrink-0">
                      {thumbnailUrl ? (
                        <Image
                          src={thumbnailUrl}
                          alt={item.title}
                          fill
                          sizes="96px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-text-muted">
                          {item.type === 'video' ? <Video size={18} /> : <Newspaper size={18} />}
                        </div>
                      )}
                    </div>
                  </Table.Td>

                  <Table.Td>
                    <Link
                      href={`/admin/news/${item.id}`}
                      className="font-semibold text-text-app hover:text-brand transition-colors line-clamp-1 block text-sm mb-0.5"
                    >
                      {item.title}
                    </Link>
                    {item.excerpt && (
                      <Text size="xs" c="dimmed" className="line-clamp-1">
                        {item.excerpt}
                      </Text>
                    )}
                  </Table.Td>

                  <Table.Td>
                    <Badge color={item.type === 'video' ? 'red' : 'blue'} variant="light" size="sm">
                      {item.type === 'video' ? 'Video' : 'Bài viết'}
                    </Badge>
                  </Table.Td>

                  <Table.Td>
                    <Badge color={isPublished ? 'teal' : 'gray'} variant="filled" size="sm">
                      {isPublished ? 'Đã xuất bản' : 'Bản nháp'}
                    </Badge>
                  </Table.Td>

                  <Table.Td>
                    <Text size="xs" c="dimmed">
                      {formatDate(item.updated_at)}
                    </Text>
                  </Table.Td>

                  <Table.Td>
                    <Menu position="bottom-end" shadow="md" withinPortal>
                      <Menu.Target>
                        <ActionIcon variant="subtle" color="gray" size="sm">
                          <MoreVertical size={16} />
                        </ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item
                          component={Link}
                          href={`/admin/news/${item.id}`}
                          leftSection={<Edit size={14} />}
                        >
                          Chỉnh sửa
                        </Menu.Item>

                        {!isPublished ? (
                          <Menu.Item
                            leftSection={<Send size={14} />}
                            color="blue"
                            onClick={() => setPublishTarget(item)}
                          >
                            Xuất bản
                          </Menu.Item>
                        ) : (
                          <Menu.Item
                            leftSection={<Undo2 size={14} />}
                            color="orange"
                            onClick={() => setUnpublishTarget(item)}
                          >
                            Hủy xuất bản
                          </Menu.Item>
                        )}

                        <Menu.Divider />
                        <Menu.Item
                          leftSection={<Trash2 size={14} />}
                          color="red"
                          disabled={isPublished}
                          onClick={() => setDeleteTarget(item)}
                        >
                          {isPublished ? 'Xóa (cần hủy xuất bản)' : 'Xóa bài'}
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </div>

      <NewsTableModals
        deleteTarget={deleteTarget}
        setDeleteTarget={setDeleteTarget}
        publishTarget={publishTarget}
        setPublishTarget={setPublishTarget}
        unpublishTarget={unpublishTarget}
        setUnpublishTarget={setUnpublishTarget}
        onDelete={onDelete}
        onPublish={onPublish}
        onUnpublish={onUnpublish}
        isActionLoading={isActionLoading}
      />
    </>
  );
}
