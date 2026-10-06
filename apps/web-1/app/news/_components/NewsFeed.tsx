'use client';

import { TextInput, Button, ActionIcon, Badge, Text } from '@mantine/core';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { NewsCard } from './NewsCard';
import { FeaturedCard } from './FeaturedCard';
import { NewsFilterModal } from './NewsFilterModal';
import { NewsPagination } from './NewsPagination';
import { useNewsFeed } from '../hooks';
import type { NewsListResult } from '@/lib/news-server';

interface NewsFeedProps {
  data: NewsListResult;
  currentType?: string;
  currentSearch?: string;
}

export function NewsFeed({ data, currentType, currentSearch }: NewsFeedProps) {
  const {
    searchInput,
    setSearchInput,
    filterOpened,
    selectedType,
    setSelectedType,
    handleSearchSubmit,
    handleClearSearch,
    handleOpenFilter,
    handleCloseFilter,
    handleApplyFilter,
    handleResetFilter,
    handleRemoveTypeFilter,
    handleClearAllFilters,
  } = useNewsFeed({ currentType, currentSearch });

  const { items, page, total_pages } = data;
  const isFiltering = Boolean(currentSearch || currentType);
  const featuredItem = !isFiltering && page === 1 && items.length > 0 ? items[0] : null;
  const listItems = !isFiltering && page === 1 && items.length > 0 ? items.slice(1) : items;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Top Search & Filter Bar */}
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
            onClick={handleOpenFilter}
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

        {/* Active Filter Tags */}
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
                    onClick={handleRemoveTypeFilter}
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
              onClick={handleClearAllFilters}
              className="text-brand hover:underline font-medium text-xs cursor-pointer ml-1"
            >
              Xóa tất cả bộ lọc
            </button>
          </div>
        )}

        {/* Filter Modal */}
        <NewsFilterModal
          opened={filterOpened}
          onClose={handleCloseFilter}
          selectedType={selectedType}
          onTypeChange={setSelectedType}
          onApply={handleApplyFilter}
          onReset={handleResetFilter}
        />
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
      <NewsPagination
        page={page}
        totalPages={total_pages}
        currentType={currentType}
        currentSearch={currentSearch}
      />
    </div>
  );
}
