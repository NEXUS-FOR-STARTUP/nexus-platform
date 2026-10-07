'use client';

import { TextInput, Button, ActionIcon, Badge, Text, Container } from '@mantine/core';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { NewsCard } from './NewsCard';
import { FeaturedCard } from './FeaturedCard';
import { NewsFilterModal } from './NewsFilterModal';
import { NewsPagination } from './NewsPagination';
import { useNewsFeed } from '../hooks';
import { getNewsCategoryName } from '@repo/validation';
import type { NewsListResult } from '@/lib/news-server';

interface NewsFeedProps {
  data: NewsListResult;
  currentType?: string;
  currentCategory?: string;
  currentTag?: string;
  currentSearch?: string;
}

export function NewsFeed({ data, currentType, currentCategory, currentTag, currentSearch }: NewsFeedProps) {
  const {
    searchInput,
    setSearchInput,
    filterOpened,
    selectedType,
    setSelectedType,
    selectedCategory,
    setSelectedCategory,
    handleSearchSubmit,
    handleClearSearch,
    handleOpenFilter,
    handleCloseFilter,
    handleApplyFilter,
    handleResetFilter,
    handleRemoveTypeFilter,
    handleRemoveCategoryFilter,
    handleRemoveTagFilter,
    handleClearAllFilters,
  } = useNewsFeed({ currentType, currentCategory, currentTag, currentSearch });

  const { items, page, total_pages } = data;
  const isFiltering = Boolean(currentSearch || currentType || currentCategory || currentTag);
  const featuredItem = !isFiltering && page === 1 && items.length > 0 ? items[0] : null;
  const listItems = !isFiltering && page === 1 && items.length > 0 ? items.slice(1) : items;
  const activeFilterCount = (currentType ? 1 : 0) + (currentCategory ? 1 : 0) + (currentTag ? 1 : 0);

  return (
    <Container size="lg" className="py-8 sm:py-12">
      {/* Top Search & Filter Bar */}
      <div className="mb-8">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 sm:gap-3 w-full">
          <TextInput
            value={searchInput}
            onChange={(e) => setSearchInput(e.currentTarget.value)}
            placeholder="Tìm kiếm bài viết, video chia sẻ..."
            size="lg"
            radius="md"
            className="flex-1 min-w-0"
            classNames={{
              input:
                'h-12 sm:h-14 text-sm sm:text-base pl-9 sm:pl-12 pr-4 sm:pr-10 border-border-app focus:border-brand bg-surface-app shadow-none placeholder:text-text-muted/60',
            }}
            leftSection={<Search className="w-4 h-4 sm:w-5 sm:h-5 text-text-muted ml-0.5" />}
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

          {/* Desktop Filter Button */}
          <Button
            type="button"
            visibleFrom="sm"
            variant={activeFilterCount > 0 ? 'light' : 'default'}
            color={activeFilterCount > 0 ? 'brand' : 'gray'}
            size="lg"
            radius="md"
            onClick={handleOpenFilter}
            leftSection={<SlidersHorizontal size={17} />}
            className="h-14 px-4 text-base font-medium shadow-none whitespace-nowrap border-border-app text-text-app hover:bg-surface-soft shrink-0"
          >
            Bộ lọc{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </Button>

          {/* Mobile Search Button */}
          <Button
            type="submit"
            hiddenFrom="sm"
            size="lg"
            radius="md"
            color="brand"
            aria-label="Tìm kiếm"
            className="h-12 w-12 p-0 shadow-none shrink-0 flex items-center justify-center"
          >
            <Search size={20} />
          </Button>

          {/* Desktop Search Button */}
          <Button
            type="submit"
            visibleFrom="sm"
            size="lg"
            radius="md"
            color="brand"
            className="h-14 px-7 text-base font-semibold shadow-none whitespace-nowrap shrink-0"
          >
            Tìm kiếm
          </Button>
        </form>

        {/* Row 2: Active Filter Tags & Mobile Filter Button */}
        <div className="flex items-center justify-between gap-2 flex-wrap mt-3">
          {/* Active Filter Tags */}
          {currentSearch || currentType || currentCategory || currentTag ? (
            <div className="flex items-center gap-2 flex-wrap text-sm text-text-muted">
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
              {currentCategory && (
                <Badge
                  variant="light"
                  color="blue"
                  size="md"
                  radius="sm"
                  className="text-xs font-semibold px-2.5 py-1"
                  rightSection={
                    <ActionIcon
                      variant="transparent"
                      color="blue"
                      size="xs"
                      onClick={handleRemoveCategoryFilter}
                      aria-label="Bỏ lọc chuyên mục"
                    >
                      <X size={13} />
                    </ActionIcon>
                  }
                >
                  Chuyên mục: {getNewsCategoryName(currentCategory)}
                </Badge>
              )}
              {currentTag && (
                <Badge
                  variant="light"
                  color="teal"
                  size="md"
                  radius="sm"
                  className="text-xs font-semibold px-2.5 py-1"
                  rightSection={
                    <ActionIcon
                      variant="transparent"
                      color="teal"
                      size="xs"
                      onClick={handleRemoveTagFilter}
                      aria-label="Bỏ lọc chủ đề"
                    >
                      <X size={13} />
                    </ActionIcon>
                  }
                >
                  Chủ đề: #{currentTag}
                </Badge>
              )}
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="text-brand hover:underline font-medium text-xs cursor-pointer ml-1"
              >
                Xóa tất cả
              </button>
            </div>
          ) : (
            <div className="hidden sm:block" />
          )}

          {/* Mobile Filter Button (Bottom Right) */}
          <Button
            type="button"
            hiddenFrom="sm"
            variant={activeFilterCount > 0 ? 'light' : 'default'}
            color={activeFilterCount > 0 ? 'brand' : 'gray'}
            radius="md"
            onClick={handleOpenFilter}
            aria-label="Bộ lọc"
            size="lg"
            className={`ml-auto h-12 ${
              activeFilterCount > 0 ? 'px-3' : 'w-12 p-0'
            } text-sm font-medium shadow-none whitespace-nowrap border-border-app text-text-app hover:bg-surface-soft shrink-0 flex items-center justify-center`}
          >
            <SlidersHorizontal size={18} />
            {activeFilterCount > 0 && (
              <span className="ml-1.5 text-xs font-semibold text-brand">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>

        {/* Filter Modal */}
        <NewsFilterModal
          opened={filterOpened}
          onClose={handleCloseFilter}
          selectedType={selectedType}
          onTypeChange={setSelectedType}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
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
        currentCategory={currentCategory}
        currentTag={currentTag}
        currentSearch={currentSearch}
      />
    </Container>
  );
}
