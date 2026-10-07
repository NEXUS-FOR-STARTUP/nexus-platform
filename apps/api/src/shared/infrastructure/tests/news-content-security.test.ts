import { test } from 'node:test';
import assert from 'node:assert';
import {
  isSafeHttpUrl,
  extractYouTubeVideoId,
  generateNewsSlug,
  TipTapDocSchema,
} from '@repo/validation';
import {
  validatePublishInvariants,
  estimateReadingMinutes,
} from '../../../modules/news/domain/news-rules.js';

test('News Content Security & Domain Rules Tests', async (t) => {
  await t.test('isSafeHttpUrl validates safe protocols and rejects malicious ones', () => {
    assert.strictEqual(isSafeHttpUrl('https://example.com/article'), true);
    assert.strictEqual(isSafeHttpUrl('http://example.com/test'), true);
    assert.strictEqual(isSafeHttpUrl('/relative/path/page'), true);

    // Hostile / unsafe URLs
    assert.strictEqual(isSafeHttpUrl('javascript:alert(1)'), false);
    assert.strictEqual(isSafeHttpUrl('data:text/html,<script>alert(1)</script>'), false);
    assert.strictEqual(isSafeHttpUrl('//protocol-relative.com'), false);
    assert.strictEqual(isSafeHttpUrl('https://user:pass@example.com'), false);
    assert.strictEqual(isSafeHttpUrl('https://example.com/\r\nevil'), false);
    assert.strictEqual(isSafeHttpUrl(''), false);
  });

  await t.test('extractYouTubeVideoId correctly extracts 11-char ID and rejects lookalikes', () => {
    assert.strictEqual(extractYouTubeVideoId('dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
    assert.strictEqual(
      extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
      'dQw4w9WgXcQ'
    );
    assert.strictEqual(
      extractYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ'),
      'dQw4w9WgXcQ'
    );
    assert.strictEqual(
      extractYouTubeVideoId('https://m.youtube.com/watch?v=dQw4w9WgXcQ'),
      'dQw4w9WgXcQ'
    );
    assert.strictEqual(
      extractYouTubeVideoId('https://www.youtube.com/shorts/dQw4w9WgXcQ'),
      'dQw4w9WgXcQ'
    );

    // Malicious or invalid
    assert.strictEqual(extractYouTubeVideoId('https://notyoutube.com/watch?v=dQw4w9WgXcQ'), null);
    assert.strictEqual(extractYouTubeVideoId('https://youtube.com/fake'), null);
    assert.strictEqual(extractYouTubeVideoId('too_short'), null);
  });

  await t.test('generateNewsSlug generates clean Vietnamese diacritic-free slug', () => {
    const slug = generateNewsSlug('Hướng dẫn Khởi nghiệp Đổi mới Sáng tạo 2026!');
    assert.strictEqual(slug, 'huong-dan-khoi-nghiep-doi-moi-sang-tao-2026');
  });

  await t.test('TipTapDocSchema enforces closed grammar and heading restrictions', () => {
    const validDoc = {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Tiêu đề phụ' }],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Nội dung bài viết ', marks: [{ type: 'bold' }] },
            {
              type: 'text',
              text: 'Liên kết',
              marks: [{ type: 'link', attrs: { href: 'https://nexusforstartup.site' } }],
            },
          ],
        },
      ],
    };

    assert.doesNotThrow(() => {
      TipTapDocSchema.parse(validDoc);
    });

    // Rejects Heading Level 1 (only 2 and 3 allowed)
    const invalidHeadingDoc = {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Tiêu đề cấp 1 không được phép' }],
        },
      ],
    };

    assert.throws(() => {
      TipTapDocSchema.parse(invalidHeadingDoc);
    });

    // Rejects unsafe link in mark
    const unsafeLinkDoc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'XSS link',
              marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }],
            },
          ],
        },
      ],
    };

    assert.throws(() => {
      TipTapDocSchema.parse(unsafeLinkDoc);
    });
  });

  await t.test('validatePublishInvariants and estimateReadingMinutes', () => {
    // Incomplete article
    const incompleteArticle = {
      type: 'article',
      title: 'Bài viết chưa xong',
      slug: null,
      excerpt: '',
      content_json: null,
      youtube_video_id: null,
      cover_image_url: null,
      cover_image_alt: null,
    };
    const res1 = validatePublishInvariants(incompleteArticle);
    assert.strictEqual(res1.ok, false);

    // Complete article
    const completeArticle = {
      type: 'article',
      title: 'Bài viết hoàn thiện',
      slug: 'bai-viet-hoan-thien',
      excerpt: 'Mô tả',
      content_json: { type: 'doc', content: [] },
      youtube_video_id: null,
      cover_image_url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      cover_image_alt: 'Mô tả ảnh',
    };
    const res2 = validatePublishInvariants(completeArticle);
    assert.strictEqual(res2.ok, true);

    // Complete video
    const completeVideo = {
      type: 'video',
      title: 'Video YouTube',
      slug: null,
      excerpt: 'Mô tả',
      content_json: null,
      youtube_video_id: 'dQw4w9WgXcQ',
      cover_image_url: null,
      cover_image_alt: null,
    };
    const res3 = validatePublishInvariants(completeVideo);
    assert.strictEqual(res3.ok, true);

    // Reading minutes
    assert.strictEqual(estimateReadingMinutes(null), 1);
    const content = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'word '.repeat(350) }] },
      ],
    };
    assert.strictEqual(estimateReadingMinutes(content), 2);
  });
});
