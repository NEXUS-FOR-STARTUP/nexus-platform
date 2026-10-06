'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export interface UseNewsFeedProps {
  currentType?: string;
  currentCategory?: string;
  currentTag?: string;
  currentSearch?: string;
}

export function useNewsFeed({ currentType, currentCategory, currentTag, currentSearch }: UseNewsFeedProps = {}) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState(currentSearch ?? '');
  const [filterOpened, setFilterOpened] = useState(false);
  const [selectedType, setSelectedType] = useState(currentType || '');
  const [selectedCategory, setSelectedCategory] = useState(currentCategory || '');

  useEffect(() => {
    setSelectedType(currentType || '');
  }, [currentType]);

  useEffect(() => {
    setSelectedCategory(currentCategory || '');
  }, [currentCategory]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const sp = new URLSearchParams();
    if (currentType) sp.set('type', currentType);
    if (currentCategory) sp.set('category', currentCategory);
    if (currentTag) sp.set('tag', currentTag);
    if (searchInput.trim()) {
      sp.set('search', searchInput.trim());
    }
    router.push(`/news${sp.toString() ? `?${sp.toString()}` : ''}`);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    const sp = new URLSearchParams();
    if (currentType) sp.set('type', currentType);
    if (currentCategory) sp.set('category', currentCategory);
    if (currentTag) sp.set('tag', currentTag);
    router.push(`/news${sp.toString() ? `?${sp.toString()}` : ''}`);
  };

  const handleOpenFilter = () => {
    setSelectedType(currentType || '');
    setSelectedCategory(currentCategory || '');
    setFilterOpened(true);
  };

  const handleCloseFilter = () => {
    setFilterOpened(false);
  };

  const handleApplyFilter = () => {
    const sp = new URLSearchParams();
    if (selectedType) sp.set('type', selectedType);
    if (selectedCategory) sp.set('category', selectedCategory);
    if (currentTag) sp.set('tag', currentTag);
    if (searchInput.trim()) sp.set('search', searchInput.trim());
    setFilterOpened(false);
    router.push(`/news${sp.toString() ? `?${sp.toString()}` : ''}`);
  };

  const handleResetFilter = () => {
    setSelectedType('');
    setSelectedCategory('');
    const sp = new URLSearchParams();
    if (currentTag) sp.set('tag', currentTag);
    if (searchInput.trim()) sp.set('search', searchInput.trim());
    setFilterOpened(false);
    router.push(`/news${sp.toString() ? `?${sp.toString()}` : ''}`);
  };

  const handleRemoveTypeFilter = () => {
    setSelectedType('');
    const sp = new URLSearchParams();
    if (currentCategory) sp.set('category', currentCategory);
    if (currentTag) sp.set('tag', currentTag);
    if (currentSearch) sp.set('search', currentSearch);
    router.push(`/news${sp.toString() ? `?${sp.toString()}` : ''}`);
  };

  const handleRemoveCategoryFilter = () => {
    setSelectedCategory('');
    const sp = new URLSearchParams();
    if (currentType) sp.set('type', currentType);
    if (currentTag) sp.set('tag', currentTag);
    if (currentSearch) sp.set('search', currentSearch);
    router.push(`/news${sp.toString() ? `?${sp.toString()}` : ''}`);
  };

  const handleRemoveTagFilter = () => {
    const sp = new URLSearchParams();
    if (currentType) sp.set('type', currentType);
    if (currentCategory) sp.set('category', currentCategory);
    if (currentSearch) sp.set('search', currentSearch);
    router.push(`/news${sp.toString() ? `?${sp.toString()}` : ''}`);
  };

  const handleClearAllFilters = () => {
    setSearchInput('');
    setSelectedType('');
    setSelectedCategory('');
    router.push('/news');
  };

  return {
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
  };
}
