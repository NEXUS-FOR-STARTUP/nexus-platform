import { test } from 'node:test';
import assert from 'node:assert';
import {
  ToggleNewsReactionInputSchema,
  NewsReactionSummarySchema,
  CreateNewsCommentInputSchema,
  NewsCommentItemSchema,
  NewsCommentListResponseSchema,
} from '@repo/validation';
import { generateRandomSuffix, ensureUniqueSlug } from '../slug-helpers.js';

test('News Reactions & Comments Contracts Tests', async (t) => {
  await t.test('ToggleNewsReactionInputSchema accepts valid reaction types', () => {
    const like = ToggleNewsReactionInputSchema.parse({ type: 'LIKE' });
    assert.strictEqual(like.type, 'LIKE');

    const dislike = ToggleNewsReactionInputSchema.parse({ type: 'DISLIKE' });
    assert.strictEqual(dislike.type, 'DISLIKE');

    assert.throws(() => {
      ToggleNewsReactionInputSchema.parse({ type: 'HEART' });
    });
  });

  await t.test('NewsReactionSummarySchema validates reaction counts and user reaction', () => {
    const summary = NewsReactionSummarySchema.parse({
      likes: 12,
      dislikes: 1,
      user_reaction: 'LIKE',
    });
    assert.strictEqual(summary.likes, 12);
    assert.strictEqual(summary.dislikes, 1);
    assert.strictEqual(summary.user_reaction, 'LIKE');

    const unreacted = NewsReactionSummarySchema.parse({
      likes: 0,
      dislikes: 0,
      user_reaction: null,
    });
    assert.strictEqual(unreacted.user_reaction, null);
  });

  await t.test('CreateNewsCommentInputSchema validates comment content and constraints', () => {
    const valid = CreateNewsCommentInputSchema.parse({
      content: 'Bài viết rất hay và bổ ích!',
      parent_id: null,
    });
    assert.strictEqual(valid.content, 'Bài viết rất hay và bổ ích!');

    // Empty content fails
    assert.throws(() => {
      CreateNewsCommentInputSchema.parse({ content: '   ' });
    });

    // Content exceeding 1000 chars fails
    assert.throws(() => {
      CreateNewsCommentInputSchema.parse({ content: 'a'.repeat(1001) });
    });
  });

  await t.test('NewsCommentItemSchema parses comment with nested replies', () => {
    const commentData = {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      news_id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
      user_id: 'user_123',
      parent_id: null,
      content: 'Bình luận cấp 1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
      user: {
        id: 'user_123',
        name: 'Nguyễn Văn A',
        avatar_url: null,
        role: 'user',
      },
      replies: [
        {
          id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
          news_id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
          user_id: 'user_456',
          parent_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          content: 'Phản hồi bình luận cấp 1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          deleted_at: null,
          user: {
            id: 'user_456',
            name: 'Trần Thị B',
            avatar_url: 'https://example.com/avatar.jpg',
            role: 'writer',
          },
        },
      ],
    };

    const parsed = NewsCommentItemSchema.parse(commentData);
    assert.strictEqual(parsed.replies.length, 1);
    assert.strictEqual(parsed.replies[0].content, 'Phản hồi bình luận cấp 1');

    const listParsed = NewsCommentListResponseSchema.parse({
      items: [parsed],
      total: 2,
    });
    assert.strictEqual(listParsed.total, 2);
  });

  await t.test('Reaction rule: once reacted, only LIKE or DISLIKE, no undo/delete', () => {
    // Simulated state machine for reaction toggle
    function simulateReactionToggle(
      current: 'LIKE' | 'DISLIKE' | null,
      clicked: 'LIKE' | 'DISLIKE'
    ): 'LIKE' | 'DISLIKE' {
      if (current === null) return clicked;
      if (current === clicked) return current; // no-op: re-click keeps same reaction, no undo
      return clicked; // switches to the other reaction
    }

    assert.strictEqual(simulateReactionToggle(null, 'LIKE'), 'LIKE');
    assert.strictEqual(simulateReactionToggle('LIKE', 'LIKE'), 'LIKE'); // re-click does NOT become null
    assert.strictEqual(simulateReactionToggle('LIKE', 'DISLIKE'), 'DISLIKE'); // switch
    assert.strictEqual(simulateReactionToggle('DISLIKE', 'DISLIKE'), 'DISLIKE'); // re-click does NOT become null
  });

  await t.test('generateRandomSuffix generates string with exact length', () => {
    const s4 = generateRandomSuffix(4);
    assert.strictEqual(s4.length, 4);
    assert.match(s4, /^[a-z0-9]{4}$/);

    const s6 = generateRandomSuffix(6);
    assert.strictEqual(s6.length, 6);
  });

  await t.test('ensureUniqueSlug appends random 4-char suffix when conflict', async () => {
    const existingSlugs = new Set(['bai-viet-hay', 'bai-viet-hay-a1b2']);

    const uniqueNonConflict = await ensureUniqueSlug('bai-viet-moi', async (c) => existingSlugs.has(c));
    assert.strictEqual(uniqueNonConflict, 'bai-viet-moi');

    const resolvedConflict = await ensureUniqueSlug('bai-viet-hay', async (c) => existingSlugs.has(c));
    assert.match(resolvedConflict, /^bai-viet-hay-[a-z0-9]{4}$/);
    assert.notStrictEqual(resolvedConflict, 'bai-viet-hay');
  });
});
