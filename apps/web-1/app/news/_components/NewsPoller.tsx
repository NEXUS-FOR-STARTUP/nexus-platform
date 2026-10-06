'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Tự động gọi router.refresh() mỗi 30 giây để cập nhật danh sách tin tức công khai */
export function NewsPoller() {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 30_000);
    return () => clearInterval(id);
  }, [router]);
  return null;
}
