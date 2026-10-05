import type { Metadata } from 'next';
import { fetchPublicNewsList } from '@/lib/news-server';
import { NewsFeed } from './_components/NewsFeed';
import { NewsPoller } from './_components/NewsPoller';

export const metadata: Metadata = {
  title: 'Tin tức & Khởi nghiệp',
  description: 'Tin tức, bài viết chuyên sâu và video hướng dẫn khởi nghiệp từ Nexus.',
};

interface NewsPageProps {
  searchParams: Promise<{
    page?: string;
    type?: string;
  }>;
}

export default async function NewsPage({ searchParams }: NewsPageProps) {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page, 10) : 1;
  const type =
    params.type === 'article' || params.type === 'video'
      ? params.type
      : undefined;

  const data = await fetchPublicNewsList({
    page: isNaN(page) || page < 1 ? 1 : page,
    type,
    limit: 12,
  });

  return <><NewsPoller /><NewsFeed data={data} currentType={type} /></>;
}
