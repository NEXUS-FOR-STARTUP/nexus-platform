'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export interface UseNewsFeedProps {
  currentType?: string;
  currentSearch?: string;
}

export function useNewsFeed({ currentType, currentSearch }: UseNewsFeedProps = {}) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState(currentSearch ?? '');
  const [filterOpened, setFilterOpened] = useState(false);
  const [selectedType, setSelectedType] = useState(currentType || '');

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

  const handleOpenFilter = () => {
    setSelectedType(currentType || '');
    setFilterOpened(true);
  };

  const handleCloseFilter = () => {
    setFilterOpened(false);
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

  const handleRemoveTypeFilter = () => {
    setSelectedType('');
    const sp = new URLSearchParams();
    if (currentSearch) sp.set('search', currentSearch);
    router.push(`/news${sp.toString() ? `?${sp.toString()}` : ''}`);
  };

  const handleClearAllFilters = () => {
    setSearchInput('');
    setSelectedType('');
    router.push('/news');
  };

  return {
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
  };
}
