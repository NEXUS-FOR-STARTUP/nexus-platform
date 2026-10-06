import { prisma } from '../../../../db.js';
import { AppError } from '../../../../shared/domain/app-error.js';
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

  async resolveNewsId(idOrSlug: string): Promise<string | null> {
    const item = await prisma.newsItem.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      select: { id: true },
    });
    return item?.id ?? null;
  }

  async toggleReaction(newsId: string, userId: string, type: 'LIKE' | 'DISLIKE') {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.newsReaction.findUnique({
        where: {
          news_id_user_id: {
            news_id: newsId,
            user_id: userId,
          },
        },
      });

      if (existing) {
        if (existing.type !== type) {
          // Switch reaction: LIKE <-> DISLIKE (no undo/delete)
          await tx.newsReaction.update({
            where: { id: existing.id },
            data: { type },
          });
        }
        // If clicking the same reaction, no-op (keep the reaction, no undo)
      } else {
        await tx.newsReaction.create({
          data: {
            news_id: newsId,
            user_id: userId,
            type,
          },
        });
      }

      const [likes, dislikes, current] = await Promise.all([
        tx.newsReaction.count({ where: { news_id: newsId, type: 'LIKE' } }),
        tx.newsReaction.count({ where: { news_id: newsId, type: 'DISLIKE' } }),
        tx.newsReaction.findUnique({
          where: { news_id_user_id: { news_id: newsId, user_id: userId } },
        }),
      ]);

      return {
        likes,
        dislikes,
        user_reaction: current?.type ?? null,
      };
    });
  }

  async getReactionSummary(newsId: string, userId?: string | null) {
    const [likes, dislikes, current] = await Promise.all([
      prisma.newsReaction.count({ where: { news_id: newsId, type: 'LIKE' } }),
      prisma.newsReaction.count({ where: { news_id: newsId, type: 'DISLIKE' } }),
      userId
        ? prisma.newsReaction.findUnique({
            where: { news_id_user_id: { news_id: newsId, user_id: userId } },
          })
        : null,
    ]);

    return {
      likes,
      dislikes,
      user_reaction: current?.type ?? null,
    };
  }

  async listCommentsByNewsId(newsId: string, currentUserId?: string | null) {
    const comments = await prisma.newsComment.findMany({
      where: {
        news_id: newsId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true,
          },
        },
      },
      orderBy: {
        created_at: 'asc',
      },
    });

    const userReactionMap = new Map<string, 'LIKE' | 'DISLIKE'>();
    if (currentUserId && comments.length > 0) {
      const userReactions = await prisma.newsCommentReaction.findMany({
        where: {
          comment_id: { in: comments.map((c) => c.id) },
          user_id: currentUserId,
        },
        select: {
          comment_id: true,
          type: true,
        },
      });
      for (const ur of userReactions) {
        userReactionMap.set(ur.comment_id, ur.type);
      }
    }

    const parents: typeof comments = [];
    const repliesMap = new Map<string, typeof comments>();

    for (const comment of comments) {
      if (!comment.parent_id) {
        parents.push(comment);
      } else {
        const list = repliesMap.get(comment.parent_id) || [];
        list.push(comment);
        repliesMap.set(comment.parent_id, list);
      }
    }

    parents.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());

    const formatUser = (u: (typeof comments)[number]['user']) => ({
      id: u.id,
      name: u.name,
      avatar_url: u.image,
      role: u.role,
    });

    const formatContent = (c: (typeof comments)[number]) =>
      c.deleted_at ? 'Bình luận này đã bị xóa.' : c.content;

    const items = parents.map((p) => {
      const replies = (repliesMap.get(p.id) || []).map((r) => ({
        id: r.id,
        news_id: r.news_id,
        user_id: r.user_id,
        parent_id: r.parent_id,
        content: formatContent(r),
        created_at: r.created_at.toISOString(),
        updated_at: r.updated_at.toISOString(),
        deleted_at: r.deleted_at?.toISOString() ?? null,
        user: formatUser(r.user),
        likes: r.likes,
        dislikes: r.dislikes,
        user_reaction: userReactionMap.get(r.id) ?? null,
      }));

      return {
        id: p.id,
        news_id: p.news_id,
        user_id: p.user_id,
        parent_id: p.parent_id,
        content: formatContent(p),
        created_at: p.created_at.toISOString(),
        updated_at: p.updated_at.toISOString(),
        deleted_at: p.deleted_at?.toISOString() ?? null,
        user: formatUser(p.user),
        likes: p.likes,
        dislikes: p.dislikes,
        user_reaction: userReactionMap.get(p.id) ?? null,
        replies,
      };
    });

    return {
      items,
      total: comments.filter((c) => !c.deleted_at).length,
    };
  }

  async createComment(data: {
    newsId: string;
    userId: string;
    content: string;
    parentId?: string | null;
  }) {
    let parentId = data.parentId || null;
    if (parentId) {
      const parent = await prisma.newsComment.findUnique({
        where: { id: parentId },
      });
      if (!parent || parent.news_id !== data.newsId) {
        throw new AppError(404, 'NOT_FOUND', 'Bình luận cha không tồn tại');
      }
      if (parent.parent_id) {
        parentId = parent.parent_id;
      }
    }

    const created = await prisma.newsComment.create({
      data: {
        news_id: data.newsId,
        user_id: data.userId,
        parent_id: parentId,
        content: data.content,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true,
          },
        },
      },
    });

    return {
      id: created.id,
      news_id: created.news_id,
      user_id: created.user_id,
      parent_id: created.parent_id,
      content: created.content,
      created_at: created.created_at.toISOString(),
      updated_at: created.updated_at.toISOString(),
      deleted_at: null,
      user: {
        id: created.user.id,
        name: created.user.name,
        avatar_url: created.user.image,
        role: created.user.role,
      },
      likes: 0,
      dislikes: 0,
      user_reaction: null,
      replies: [],
    };
  }

  async deleteComment(commentId: string, actorId: string, actorRole?: string | null) {
    const comment = await prisma.newsComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new AppError(404, 'NOT_FOUND', 'Bình luận không tồn tại');
    }

    const isAdminOrWriter = actorRole === 'admin' || actorRole === 'writer';
    const isAuthor = comment.user_id === actorId;

    if (!isAuthor && !isAdminOrWriter) {
      throw new AppError(403, 'FORBIDDEN', 'Bạn không có quyền xóa bình luận này');
    }

    await prisma.newsComment.update({
      where: { id: commentId },
      data: { deleted_at: new Date() },
    });

    return { success: true };
  }

  async toggleCommentReaction(commentId: string, userId: string, type: 'LIKE' | 'DISLIKE') {
    return prisma.$transaction(async (tx) => {
      const comment = await tx.newsComment.findUnique({
        where: { id: commentId },
        select: { id: true, deleted_at: true, likes: true, dislikes: true },
      });

      if (!comment || comment.deleted_at) {
        throw new AppError(404, 'NOT_FOUND', 'Bình luận không tồn tại hoặc đã bị xóa');
      }

      const existing = await tx.newsCommentReaction.findUnique({
        where: {
          comment_id_user_id: {
            comment_id: commentId,
            user_id: userId,
          },
        },
      });

      let updatedLikes = comment.likes;
      let updatedDislikes = comment.dislikes;

      if (existing) {
        if (existing.type !== type) {
          // Switch reaction: LIKE <-> DISLIKE
          await tx.newsCommentReaction.update({
            where: { id: existing.id },
            data: { type },
          });

          if (type === 'LIKE') {
            await tx.newsComment.update({
              where: { id: commentId },
              data: {
                likes: { increment: 1 },
                dislikes: { decrement: 1 },
              },
            });
            updatedLikes += 1;
            updatedDislikes = Math.max(0, updatedDislikes - 1);
          } else {
            await tx.newsComment.update({
              where: { id: commentId },
              data: {
                likes: { decrement: 1 },
                dislikes: { increment: 1 },
              },
            });
            updatedLikes = Math.max(0, updatedLikes - 1);
            updatedDislikes += 1;
          }
        }
        // If clicking the same reaction, no-op (keep reaction)
      } else {
        await tx.newsCommentReaction.create({
          data: {
            comment_id: commentId,
            user_id: userId,
            type,
          },
        });

        if (type === 'LIKE') {
          await tx.newsComment.update({
            where: { id: commentId },
            data: { likes: { increment: 1 } },
          });
          updatedLikes += 1;
        } else {
          await tx.newsComment.update({
            where: { id: commentId },
            data: { dislikes: { increment: 1 } },
          });
          updatedDislikes += 1;
        }
      }

      return {
        likes: updatedLikes,
        dislikes: updatedDislikes,
        user_reaction: type,
      };
    });
  }
}

export const newsRepository = new PrismaNewsRepository();
