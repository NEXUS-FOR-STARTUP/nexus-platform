import { test } from 'node:test';
import assert from 'node:assert';
import {
  PublicNewsListQuerySchema,
  NewsArticlePublicCardSchema,
  NewsVideoPublicCardSchema,
  NewsItemPublicCardSchema,
  NewsArticlePublicDetailSchema,
} from '@repo/validation';

test('News Public Contracts & Boundary Tests', async (t) => {
  await t.test('PublicNewsListQuerySchema enforces default and max pagination', () => {
    const defaultQuery = PublicNewsListQuerySchema.parse({});
    assert.strictEqual(defaultQuery.page, 1);
    assert.strictEqual(defaultQuery.limit, 12);

    const customQuery = PublicNewsListQuerySchema.parse({ page: '2', limit: '30' });
    assert.strictEqual(customQuery.page, 2);
    assert.strictEqual(customQuery.limit, 30);

    // Limit capped at 48
    assert.throws(() => {
      PublicNewsListQuerySchema.parse({ limit: '49' });
    });
  });

  await t.test('NewsArticlePublicCardSchema validates article cards', () => {
    const validArticle = {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      type: 'article',
      title: 'Khởi nghiệp 2026',
      slug: 'khoi-nghiep-2026',
      excerpt: 'Mô tả ngắn bài viết',
      cover_image_url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      cover_image_alt: 'Ảnh mẫu',
      published_at: new Date().toISOString(),
    };

    const parsed = NewsArticlePublicCardSchema.parse(validArticle);
    assert.strictEqual(parsed.type, 'article');
    assert.strictEqual(parsed.slug, 'khoi-nghiep-2026');

    // Discriminated union parses it
    const unionParsed = NewsItemPublicCardSchema.parse(validArticle);
    assert.strictEqual(unionParsed.type, 'article');
  });

  await t.test('NewsVideoPublicCardSchema validates video cards with YouTube thumbnail', () => {
    const validVideo = {
      id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
      type: 'video',
      title: 'Video hướng dẫn gọi vốn',
      excerpt: 'Tóm tắt video YouTube',
      youtube_video_id: 'dQw4w9WgXcQ',
      youtube_thumbnail_url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      published_at: new Date().toISOString(),
    };

    const parsed = NewsVideoPublicCardSchema.parse(validVideo);
    assert.strictEqual(parsed.type, 'video');
    assert.strictEqual(parsed.youtube_video_id, 'dQw4w9WgXcQ');

    const unionParsed = NewsItemPublicCardSchema.parse(validVideo);
    assert.strictEqual(unionParsed.type, 'video');
  });

  await t.test('NewsArticlePublicDetailSchema enforces Nexus Team byline and excludes admin IDs', () => {
    const articleDetail = {
      id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
      type: 'article',
      title: 'Chi tiết bài viết',
      slug: 'chi-tiet-bai-viet',
      excerpt: 'Mô tả bài viết',
      content_json: { type: 'doc', content: [] },
      cover_image_url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      cover_image_alt: 'Mô tả ảnh bìa',
      published_at: new Date().toISOString(),
      author_byline: 'Nexus Team',
    };

    const parsed = NewsArticlePublicDetailSchema.parse(articleDetail);
    assert.strictEqual(parsed.author_byline, 'Nexus Team');

    // Must reject any other author byline
    assert.throws(() => {
      NewsArticlePublicDetailSchema.parse({
        ...articleDetail,
        author_byline: 'Admin Person',
      });
    });
  });
});
