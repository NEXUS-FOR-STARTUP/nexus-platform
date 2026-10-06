import {
  NewsListResponseSchema,
  NewsItemPublicCardSchema,
  NewsArticlePublicDetailSchema,
  type NewsItemPublicCard,
  type NewsArticlePublicDetail,
} from '@repo/validation';

const API_BASE_URL =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:8000';

export interface FetchNewsListParams {
  page?: number;
  limit?: number;
  type?: 'article' | 'video';
  search?: string;
}

export interface NewsListResult {
  items: NewsItemPublicCard[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export async function fetchPublicNewsList(
  params: FetchNewsListParams = {}
): Promise<NewsListResult> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.type) searchParams.set('type', params.type);
  if (params.search) searchParams.set('search', params.search);

  const url = `${API_BASE_URL}/api/news?${searchParams.toString()}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error(`Lỗi tải danh sách tin tức: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  const schema = NewsListResponseSchema(NewsItemPublicCardSchema);
  return schema.parse(json);
}

export async function fetchPublicArticleDetail(
  slug: string
): Promise<NewsArticlePublicDetail | null> {
  const encodedSlug = encodeURIComponent(slug);
  const url = `${API_BASE_URL}/api/news/${encodedSlug}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    next: { revalidate: 60 },
  });

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    throw new Error(`Lỗi tải bài viết: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  return NewsArticlePublicDetailSchema.parse(json);
}
