import { newsRepository } from '../infrastructure/persistence/prisma-news.repository.js';
import { AppError } from '../../../shared/domain/app-error.js';
import type {
  PublicNewsListQuery,
  AdminNewsListQuery,
  NewsItemPublicCard,
  NewsArticlePublicDetail,
  NewsItemAdmin,
} from '@repo/validation';

export async function getPublicNewsListUseCase(query: PublicNewsListQuery) {
  const result = await newsRepository.listPublicPublishedNews({
    page: query.page,
    limit: query.limit,
    type: query.type,
    category: query.category,
    tag: query.tag,
    search: query.search,
  });

  const mappedItems: NewsItemPublicCard[] = result.items.map((item) => {
    const authorByline = item.author?.name || (item.type === 'video' ? 'Nexus Video' : 'Nexus Team');
    const authorAvatarUrl = item.author?.image ?? null;

    if (item.type === 'article') {
      return {
        id: item.id,
        type: 'article',
        title: item.title,
        slug: item.slug ?? '',
        excerpt: item.excerpt,
        category: item.category,
        tags: item.tags,
        cover_image_url: item.cover_image_url,
        cover_image_alt: item.cover_image_alt,
        published_at: item.published_at?.toISOString() ?? item.created_at.toISOString(),
        author_byline: authorByline,
        author_avatar_url: authorAvatarUrl,
      };
    }
    return {
      id: item.id,
      type: 'video',
      title: item.title,
      excerpt: item.excerpt,
      category: item.category,
      tags: item.tags,
      youtube_video_id: item.youtube_video_id ?? '',
      youtube_thumbnail_url: `https://img.youtube.com/vi/${item.youtube_video_id}/hqdefault.jpg`,
      published_at: item.published_at?.toISOString() ?? item.created_at.toISOString(),
      author_byline: authorByline,
      author_avatar_url: authorAvatarUrl,
    };
  });

  return {
    items: mappedItems,
    total: result.total,
    page: result.page,
    limit: result.limit,
    total_pages: result.total_pages,
  };
}

export async function getPublicArticleDetailUseCase(slug: string): Promise<NewsArticlePublicDetail> {
  const item = await newsRepository.findPublicPublishedArticleBySlug(slug);
  if (!item) {
    throw new AppError(404, 'NOT_FOUND', 'Bài viết không tồn tại hoặc chưa được xuất bản');
  }

  const authorByline = item.author?.name || 'Nexus Team';
  const authorAvatarUrl = item.author?.image ?? null;

  return {
    id: item.id,
    type: 'article',
    title: item.title,
    slug: item.slug ?? '',
    excerpt: item.excerpt,
    category: item.category,
    tags: item.tags,
    content_json: item.content_json,
    cover_image_url: item.cover_image_url,
    cover_image_alt: item.cover_image_alt,
    published_at: item.published_at?.toISOString() ?? item.created_at.toISOString(),
    author_byline: authorByline,
    author_avatar_url: authorAvatarUrl,
  };
}

export async function getAdminNewsListUseCase(query: AdminNewsListQuery) {
  const result = await newsRepository.listAdminNews({
    page: query.page,
    limit: query.limit,
    type: query.type,
    status: query.status,
    category: query.category,
    tag: query.tag,
    sort: query.sort,
    search: query.search,
  });

  const mappedItems: NewsItemAdmin[] = result.items.map((item) => ({
    id: item.id,
    type: item.type as 'article' | 'video',
    status: item.status as 'draft' | 'published',
    title: item.title,
    slug: item.slug,
    excerpt: item.excerpt,
    category: item.category,
    tags: item.tags,
    content_json: item.content_json,
    youtube_video_id: item.youtube_video_id,
    cover_image_url: item.cover_image_url,
    cover_image_public_id: item.cover_image_public_id,
    cover_image_alt: item.cover_image_alt,
    published_at: item.published_at?.toISOString() ?? null,
    created_by_auth_user_id: item.created_by_auth_user_id,
    updated_by_auth_user_id: item.updated_by_auth_user_id,
    created_at: item.created_at.toISOString(),
    updated_at: item.updated_at.toISOString(),
  }));

  return {
    items: mappedItems,
    total: result.total,
    page: result.page,
    limit: result.limit,
    total_pages: result.total_pages,
  };
}

export async function getAdminNewsDetailUseCase(id: string): Promise<NewsItemAdmin> {
  const item = await newsRepository.findAdminNewsById(id);
  if (!item) {
    throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy mục tin tức');
  }

  return {
    id: item.id,
    type: item.type as 'article' | 'video',
    status: item.status as 'draft' | 'published',
    title: item.title,
    slug: item.slug,
    excerpt: item.excerpt,
    category: item.category,
    tags: item.tags,
    content_json: item.content_json,
    youtube_video_id: item.youtube_video_id,
    cover_image_url: item.cover_image_url,
    cover_image_public_id: item.cover_image_public_id,
    cover_image_alt: item.cover_image_alt,
    published_at: item.published_at?.toISOString() ?? null,
    created_by_auth_user_id: item.created_by_auth_user_id,
    updated_by_auth_user_id: item.updated_by_auth_user_id,
    created_at: item.created_at.toISOString(),
    updated_at: item.updated_at.toISOString(),
  };
}
