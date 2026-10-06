import { prisma } from '../../../../db.js';
import type { Prisma } from '@prisma/client';

export interface ListPublicNewsOptions {
  page: number;
  limit: number;
  type?: 'article' | 'video';
  category?: string;
  tag?: string;
  search?: string;
}

export interface ListAdminNewsOptions {
  page: number;
  limit: number;
  type?: 'article' | 'video';
  status?: 'draft' | 'published';
  category?: string;
  tag?: string;
  sort?: 'newest' | 'oldest';
  search?: string;
}

export class PrismaNewsRepository {
  async listPublicPublishedNews(opts: ListPublicNewsOptions) {
    const where: Prisma.NewsItemWhereInput = {
      status: 'published',
      published_at: { lte: new Date() },
      ...(opts.type ? { type: opts.type } : {}),
      ...(opts.category ? { category: opts.category } : {}),
      ...(opts.tag ? { tags: { has: opts.tag } } : {}),
      ...(opts.search?.trim()
        ? {
            title: {
              contains: opts.search.trim(),
              mode: 'insensitive',
            },
          }
        : {}),
    };

    const skip = (opts.page - 1) * opts.limit;

    const [rawItems, total] = await Promise.all([
      prisma.newsItem.findMany({
        where,
        select: {
          id: true,
          type: true,
          title: true,
          slug: true,
          excerpt: true,
          category: true,
          tags: true,
          youtube_video_id: true,
          cover_image_url: true,
          cover_image_alt: true,
          published_at: true,
          created_at: true,
          created_by_auth_user_id: true,
        },
        orderBy: [{ published_at: 'desc' }, { id: 'desc' }],
        skip,
        take: opts.limit,
      }),
      prisma.newsItem.count({ where }),
    ]);

    const authorIds = [
      ...new Set(
        rawItems
          .map((i) => i.created_by_auth_user_id)
          .filter((id): id is string => typeof id === 'string' && id.length > 0)
      ),
    ];
    const authors = authorIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: authorIds } },
          select: { id: true, name: true, image: true },
        })
      : [];
    const authorMap = new Map(authors.map((u) => [u.id, u]));

    const items = rawItems.map((item) => ({
      ...item,
      author: (item.created_by_auth_user_id ? authorMap.get(item.created_by_auth_user_id) : null) ?? null,
    }));

    return {
      items,
      total,
      page: opts.page,
      limit: opts.limit,
      total_pages: Math.ceil(total / opts.limit),
    };
  }

  async findPublicPublishedArticleBySlug(slug: string) {
    const item = await prisma.newsItem.findFirst({
      where: {
        type: 'article',
        status: 'published',
        slug,
        published_at: { lte: new Date() },
      },
    });

    if (!item) return null;

    const author = item.created_by_auth_user_id
      ? await prisma.user.findUnique({
          where: { id: item.created_by_auth_user_id },
          select: { id: true, name: true, image: true },
        })
      : null;

    return {
      ...item,
      author,
    };
  }

  async listAdminNews(opts: ListAdminNewsOptions) {
    const where: Prisma.NewsItemWhereInput = {
      ...(opts.type ? { type: opts.type } : {}),
      ...(opts.status ? { status: opts.status } : {}),
      ...(opts.category ? { category: opts.category } : {}),
      ...(opts.tag ? { tags: { has: opts.tag } } : {}),
      ...(opts.search?.trim()
        ? {
            title: {
              contains: opts.search.trim(),
              mode: 'insensitive',
            },
          }
        : {}),
    };

    const orderBy: Prisma.NewsItemOrderByWithRelationInput[] =
      opts.sort === 'oldest'
        ? [{ updated_at: 'asc' }, { id: 'asc' }]
        : [{ updated_at: 'desc' }, { id: 'desc' }];

    const skip = (opts.page - 1) * opts.limit;

    const [items, total] = await Promise.all([
      prisma.newsItem.findMany({
        where,
        orderBy,
        skip,
        take: opts.limit,
      }),
      prisma.newsItem.count({ where }),
    ]);

    return {
      items,
      total,
      page: opts.page,
      limit: opts.limit,
      total_pages: Math.ceil(total / opts.limit),
    };
  }

  async findAdminNewsById(id: string) {
    return prisma.newsItem.findUnique({
      where: { id },
    });
  }

  async createNewsItem(data: Prisma.NewsItemCreateInput) {
    return prisma.newsItem.create({
      data,
    });
  }

  async updateNewsItemConditional(
    id: string,
    expectedUpdatedAt: Date,
    data: Prisma.NewsItemUpdateInput,
    actorId?: string
  ) {
    return prisma.$transaction(async (tx) => {
      const current = await tx.newsItem.findFirst({
        where: {
          id,
          updated_at: expectedUpdatedAt,
        },
      });

      if (!current) {
        return null;
      }

      if (actorId) {
        await tx.newsItemRevision.create({
          data: {
            news_item_id: id,
            snapshot: {
              type: current.type,
              status: current.status,
              title: current.title,
              slug: current.slug,
              excerpt: current.excerpt,
              content_json: current.content_json,
              category: current.category,
              tags: current.tags,
              youtube_video_id: current.youtube_video_id,
              cover_image_url: current.cover_image_url,
              cover_image_public_id: current.cover_image_public_id,
              cover_image_alt: current.cover_image_alt,
              published_at: current.published_at?.toISOString() ?? null,
              created_by_auth_user_id: current.created_by_auth_user_id,
              updated_by_auth_user_id: current.updated_by_auth_user_id,
              updated_at: current.updated_at.toISOString(),
            },
            created_by_auth_user_id: actorId,
          },
        });
      }

      return tx.newsItem.update({
        where: { id },
        data,
      });
    });
  }

  async deleteNewsItemConditional(id: string, expectedUpdatedAt: Date) {
    const result = await prisma.newsItem.deleteMany({
      where: {
        id,
        status: 'draft',
        updated_at: expectedUpdatedAt,
      },
    });

    return result.count > 0;
  }

  async findSlugConflict(slug: string, excludeId?: string) {
    const item = await prisma.newsItem.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!item) return false;
    if (excludeId && item.id === excludeId) return false;
    return true;
  }
}

export const newsRepository = new PrismaNewsRepository();
