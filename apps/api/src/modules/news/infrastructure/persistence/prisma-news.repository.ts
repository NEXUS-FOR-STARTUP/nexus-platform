import { prisma } from '../../../../db.js';
import type { Prisma } from '@prisma/client';

export interface ListPublicNewsOptions {
  page: number;
  limit: number;
  type?: 'article' | 'video';
}

export interface ListAdminNewsOptions {
  page: number;
  limit: number;
  type?: 'article' | 'video';
  status?: 'draft' | 'published';
  sort?: 'newest' | 'oldest';
}

export class PrismaNewsRepository {
  async listPublicPublishedNews(opts: ListPublicNewsOptions) {
    const where: Prisma.NewsItemWhereInput = {
      status: 'published',
      published_at: { lte: new Date() },
      ...(opts.type ? { type: opts.type } : {}),
    };

    const skip = (opts.page - 1) * opts.limit;

    const [items, total] = await Promise.all([
      prisma.newsItem.findMany({
        where,
        orderBy: [{ published_at: 'desc' }, { id: 'desc' }],
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

  async findPublicPublishedArticleBySlug(slug: string) {
    return prisma.newsItem.findFirst({
      where: {
        type: 'article',
        status: 'published',
        slug,
        published_at: { lte: new Date() },
      },
    });
  }

  async listAdminNews(opts: ListAdminNewsOptions) {
    const where: Prisma.NewsItemWhereInput = {
      ...(opts.type ? { type: opts.type } : {}),
      ...(opts.status ? { status: opts.status } : {}),
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
    data: Prisma.NewsItemUpdateInput
  ) {
    const result = await prisma.newsItem.updateMany({
      where: {
        id,
        updated_at: expectedUpdatedAt,
      },
      data,
    });

    if (result.count === 0) {
      return null;
    }

    return prisma.newsItem.findUnique({
      where: { id },
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
