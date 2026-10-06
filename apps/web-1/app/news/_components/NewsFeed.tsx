'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Button,
  Group,
  Text,
  Badge,
  Avatar,
  TextInput,
  ActionIcon,
  Modal,
  Radio,
} from '@mantine/core';
import { Play, Search, X, SlidersHorizontal } from 'lucide-react';
import { NewsCard } from './NewsCard';
import type { NewsListResult } from '@/lib/news-server';
import type { NewsItemPublicCard } from '@repo/validation';

interface NewsFeedProps {
  data: NewsListResult;
  currentType?: string;
  currentSearch?: string;
}

function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60));

    if (diffHours < 1) return 'Vừa xong';
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffHours < 48) return 'Hôm qua';

    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

function FeaturedCard({ item }: { item: NewsItemPublicCard }) {
  const isVideo = item.type === 'video';
  const targetUrl = isVideo
    ? `https://www.youtube.com/watch?v=${item.youtube_video_id}`
    : `/news/${item.slug}`;
  const authorName = item.author_byline || (isVideo ? 'Nexus Video' : 'Nexus Team');
  const authorInitials = authorName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || (isVideo ? 'YT' : 'NX');

  return (
    <article className="group mb-10 bg-surface-app border border-border-app rounded-lg p-5 sm:p-7 hover:border-brand/50 transition-all duration-200">
      <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 items-center">
        {/* Featured Image */}
        <div className="relative w-full lg:w-[480px] aspect-video rounded-md overflow-hidden bg-surface-soft shrink-0">
          {isVideo ? (
            <a href={targetUrl} target="_blank" rel="noopener noreferrer" className="block w-full h-full relative">
              <Image
                src={item.youtube_thumbnail_url}
                alt={item.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 480px"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/25 flex items-center justify-center group-hover:bg-black/35 transition-colors">
                <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white shadow-lg">
                  <Play size={22} className="fill-current ml-0.5" />
                </div>
              </div>
            </a>
          ) : item.cover_image_url ? (
            <Link href={targetUrl} className="block w-full h-full relative">
              <Image
                src={item.cover_image_url}
                alt={item.cover_image_alt || item.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 480px"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </Link>
          ) : null}
        </div>

        {/* Featured Info */}
        <div className="flex-1 flex flex-col justify-between w-full">
          <div>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <Avatar
                  src={item.author_avatar_url}
                  color={isVideo ? 'red' : 'blue'}
                  radius="xl"
                  size="sm"
                  className="text-xs font-bold shrink-0"
                >
                  {authorInitials}
                </Avatar>
                <span className="text-sm font-semibold text-text-app truncate">
                  {authorName}
                </span>
                <span className="text-xs text-text-muted shrink-0">
                  {formatDate(item.published_at)}
                </span>
              </div>
              <Badge
                color={isVideo ? 'red' : 'blue'}
                variant="light"
                size="md"
                radius="xs"
                className="font-bold uppercase tracking-wider text-xs px-2.5 py-1"
              >
                {isVideo ? 'Video nổi bật' : 'Bài viết mới nhất'}
              </Badge>
            </div>

            <Link href={targetUrl} target={isVideo ? '_blank' : undefined} rel={isVideo ? 'noopener noreferrer' : undefined}>
              <h2 className="text-xl sm:text-2xl lg:text-[26px] font-bold text-text-app group-hover:text-brand transition-colors leading-snug tracking-tight mb-3">
                {item.title}
              </h2>
            </Link>

            {item.excerpt && (
              <p className="font-serif text-base text-text-app/85 line-clamp-3 leading-relaxed">
                {item.excerpt}
              </p>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export function NewsFeed({ data, currentType, currentSearch }: NewsFeedProps) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState(currentSearch ?? '');
  const [filterOpened, setFilterOpened] = useState(false);
  const [selectedType, setSelectedType] = useState(currentType || '');
  const { items, page, total_pages } = data;

  useEffect(() => {
    setSelectedType(currentType || '');
  }, [currentType]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const sp = new URLSearchParams();
    if (currentType) sp.set('type', currentType);
    if (searchInput.trim()) {
      sp.set('search', searchInput.trim());
    }
    router.push(`/news${sp.toString() ? `?${sp.toString()}` : ''}`);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    const sp = new URLSearchParams();
    if (currentType) sp.set('type', currentType);
    router.push(`/news${sp.toString() ? `?${sp.toString()}` : ''}`);
  };

  const handleApplyFilter = () => {
    const sp = new URLSearchParams();
    if (selectedType) sp.set('type', selectedType);
    if (searchInput.trim()) sp.set('search', searchInput.trim());
    setFilterOpened(false);
    router.push(`/news${sp.toString() ? `?${sp.toString()}` : ''}`);
  };

  const handleResetFilter = () => {
    setSelectedType('');
    const sp = new URLSearchParams();
    if (searchInput.trim()) sp.set('search', searchInput.trim());
    setFilterOpened(false);
    router.push(`/news${sp.toString() ? `?${sp.toString()}` : ''}`);
  };

  // When searching or filtering, display all results in a clean grid rather than extracting a hero card
  const isFiltering = Boolean(currentSearch || currentType);
  const featuredItem = !isFiltering && page === 1 && items.length > 0 ? items[0] : null;
  const listItems = !isFiltering && page === 1 && items.length > 0 ? items.slice(1) : items;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Big Search Bar on Top */}
      <div className="mb-8">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2.5 sm:gap-3 w-full">
          <TextInput
            value={searchInput}
            onChange={(e) => setSearchInput(e.currentTarget.value)}
            placeholder="Tìm kiếm bài viết, video chia sẻ theo tiêu đề..."
            size="lg"
            radius="md"
            className="flex-1"
            classNames={{
              input:
                'h-12 sm:h-14 text-base pl-11 sm:pl-12 pr-10 border-border-app focus:border-brand bg-surface-app shadow-none placeholder:text-text-muted/60',
            }}
            leftSection={<Search size={20} className="text-text-muted ml-0.5" />}
            rightSection={
              searchInput ? (
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="sm"
                  onClick={handleClearSearch}
                  aria-label="Xóa tìm kiếm"
                >
                  <X size={16} />
                </ActionIcon>
              ) : null
            }
          />
          <Button
            type="button"
            variant={currentType ? 'light' : 'default'}
            color={currentType ? 'brand' : 'gray'}
            size="lg"
            radius="md"
            onClick={() => {
              setSelectedType(currentType || '');
              setFilterOpened(true);
            }}
            leftSection={<SlidersHorizontal size={17} />}
            className="h-12 sm:h-14 px-3.5 sm:px-4 text-sm sm:text-base font-medium shadow-none whitespace-nowrap border-border-app text-text-app hover:bg-surface-soft shrink-0"
          >
            Bộ lọc{currentType ? ` (1)` : ''}
          </Button>

          <Button
            type="submit"
            size="lg"
            radius="md"
            color="brand"
            className="h-12 sm:h-14 px-5 sm:px-7 text-sm sm:text-base font-semibold shadow-none whitespace-nowrap shrink-0"
          >
            Tìm kiếm
          </Button>
        </form>

        {/* Sub-bar below search: Only shown when there are active search or filter tags */}
        {(currentSearch || currentType) && (
          <div className="flex items-center gap-2 flex-wrap text-sm text-text-muted mt-3 px-1">
            {currentSearch && (
              <span>
                Tìm kiếm: <strong className="text-text-app">"{currentSearch}"</strong>
              </span>
            )}
            {currentType && (
              <Badge
                variant="light"
                color="brand"
                size="md"
                radius="sm"
                className="text-xs font-semibold px-2.5 py-1"
                rightSection={
                  <ActionIcon
                    variant="transparent"
                    color="brand"
                    size="xs"
                    onClick={() => {
                      setSelectedType('');
                      const sp = new URLSearchParams();
                      if (currentSearch) sp.set('search', currentSearch);
                      router.push(`/news${sp.toString() ? `?${sp.toString()}` : ''}`);
                    }}
                    aria-label="Bỏ lọc loại nội dung"
                  >
                    <X size={13} />
                  </ActionIcon>
                }
              >
                {currentType === 'article' ? 'Bài viết' : currentType === 'video' ? 'Video' : currentType}
              </Badge>
            )}
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setSelectedType('');
                router.push('/news');
              }}
              className="text-brand hover:underline font-medium text-xs cursor-pointer ml-1"
            >
              Xóa tất cả bộ lọc
            </button>
          </div>
        )}

        {/* Small Filter Modal */}
        <Modal
          opened={filterOpened}
          onClose={() => setFilterOpened(false)}
          title={<span className="font-bold text-base text-text-app">Bộ lọc nội dung</span>}
          size="xs"
          centered
          radius="md"
          padding="lg"
        >
          <div className="pt-2 pb-1">
            <div className="mb-6">
              <label className="block text-sm font-semibold text-text-app mb-3.5">
                Loại nội dung
              </label>
              <Radio.Group
                value={selectedType}
                onChange={setSelectedType}
              >
                <div className="flex flex-col gap-3.5 pl-0.5">
                  <Radio
                    value=""
                    label="Tất cả nội dung"
                    size="sm"
                    className="cursor-pointer"
                    classNames={{
                      label: 'cursor-pointer pl-3 text-sm font-normal text-text-app select-none',
                      radio: 'cursor-pointer',
                    }}
                  />
                  <Radio
                    value="article"
                    label="Bài viết"
                    size="sm"
                    className="cursor-pointer"
                    classNames={{
                      label: 'cursor-pointer pl-3 text-sm font-normal text-text-app select-none',
                      radio: 'cursor-pointer',
                    }}
                  />
                  <Radio
                    value="video"
                    label="Video"
                    size="sm"
                    className="cursor-pointer"
                    classNames={{
                      label: 'cursor-pointer pl-3 text-sm font-normal text-text-app select-none',
                      radio: 'cursor-pointer',
                    }}
                  />
                </div>
              </Radio.Group>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4">
              <Button
                variant="subtle"
                color="gray"
                size="sm"
                onClick={handleResetFilter}
                className="font-medium"
              >
                Đặt lại
              </Button>
              <Button
                color="brand"
                size="sm"
                onClick={handleApplyFilter}
                className="font-semibold px-4"
              >
                Áp dụng
              </Button>
            </div>
          </div>
        </Modal>
      </div>

      {/* Empty State */}
      {items.length === 0 ? (
        <div className="text-center py-36 bg-surface-app rounded-lg border border-border-app">
          <Text size="lg" fw={500} className="text-text-app mb-1">
            Chưa có nội dung nào
          </Text>
          <Text size="sm" c="dimmed" className="font-serif">
            Nội dung mới sẽ sớm được cập nhật. Vui lòng quay lại sau!
          </Text>
        </div>
      ) : (
        <>
          {/* Featured Hero Card on Page 1 */}
          {featuredItem && <FeaturedCard item={featuredItem} />}

          {/* Regular List Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {listItems.map((item) => (
              <NewsCard key={item.id} item={item} />
            ))}
          </div>
        </>
      )}

      {/* Pagination */}
      {total_pages > 1 && (
        <Group justify="center" mt="xl" gap="sm">
          {page > 1 && (
            <Button
              component={Link}
              href={`/news?page=${page - 1}${currentType ? `&type=${currentType}` : ''}${currentSearch ? `&search=${encodeURIComponent(currentSearch)}` : ''}`}
              variant="default"
              size="sm"
              radius="md"
            >
              Trang trước
            </Button>
          )}
          <Text size="sm" className="text-text-muted px-2 font-serif">
            Trang {page} / {total_pages}
          </Text>
          {page < total_pages && (
            <Button
              component={Link}
              href={`/news?page=${page + 1}${currentType ? `&type=${currentType}` : ''}${currentSearch ? `&search=${encodeURIComponent(currentSearch)}` : ''}`}
              variant="default"
              size="sm"
              radius="md"
            >
              Trang sau
            </Button>
          )}
        </Group>
      )}
    </div>
  );
}
