import type { Metadata } from 'next';
import { fetchPublicNewsList } from '@/lib/news-server';
import { NewsFeed } from './_components/NewsFeed';
import { NewsPoller } from './_components/NewsPoller';

export const metadata: Metadata = {
  title: 'Bài viết',
  description: 'Bài viết chuyên sâu, góc nhìn và video chia sẻ khởi nghiệp từ Nexus.',
};

interface NewsPageProps {
  searchParams: Promise<{
    page?: string;
    type?: string;
    category?: string;
    tag?: string;
    search?: string;
  }>;
}

export default async function NewsPage({ searchParams }: NewsPageProps) {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page, 10) : 1;
  const type =
    params.type === 'article' || params.type === 'video'
      ? params.type
      : undefined;
  const category = params.category?.trim() || undefined;
  const tag = params.tag?.trim() || undefined;
  const search = params.search?.trim() || undefined;

  const data = await fetchPublicNewsList({
    page: isNaN(page) || page < 1 ? 1 : page,
    type,
    category,
    tag,
    search,
    limit: 12,
  });

  return (
    <>
      <NewsPoller />
      <NewsFeed
        data={data}
        currentType={type}
        currentCategory={category}
        currentTag={tag}
        currentSearch={search}
      />
    </>
  );
}
