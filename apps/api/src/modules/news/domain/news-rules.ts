export function estimateReadingMinutes(contentJson: unknown): number {
  if (!contentJson || typeof contentJson !== 'object') return 1;
  let wordCount = 0;

  function walk(node: unknown) {
    if (!node || typeof node !== 'object') return;
    if ('text' in node && typeof node.text === 'string') {
      const words = node.text.trim().split(/\s+/).filter(Boolean);
      wordCount += words.length;
    }
    if ('content' in node && Array.isArray(node.content)) {
      for (const child of node.content) {
        walk(child);
      }
    }
  }
  walk(contentJson);
  const minutes = Math.ceil(wordCount / 200);
  return Math.max(1, minutes);
}

export interface PublishableItem {
  type: string;
  title: string;
  slug: string | null;
  excerpt: string;
  content_json: unknown;
  youtube_video_id: string | null;
  cover_image_url: string | null;
  cover_image_alt: string | null;
}

export function validatePublishInvariants(item: PublishableItem): { ok: true } | { ok: false; error: string } {
  if (item.type === 'article') {
    if (!item.slug || item.slug.trim().length === 0) {
      return { ok: false, error: 'Bài viết xuất bản bắt buộc phải có đường dẫn (slug)' };
    }
    if (!item.cover_image_url) {
      return { ok: false, error: 'Bài viết xuất bản bắt buộc phải có ảnh bìa' };
    }
    if (!item.cover_image_alt || item.cover_image_alt.trim().length === 0) {
      return { ok: false, error: 'Bài viết xuất bản bắt buộc phải có mô tả ảnh bìa (alt)' };
    }
    if (!item.content_json) {
      return { ok: false, error: 'Bài viết xuất bản bắt buộc phải có nội dung' };
    }
    return { ok: true };
  }

  if (item.type === 'video') {
    if (!item.youtube_video_id || !/^[a-zA-Z0-9_-]{11}$/.test(item.youtube_video_id)) {
      return { ok: false, error: 'Video xuất bản bắt buộc phải có YouTube Video ID 11 ký tự hợp lệ' };
    }
    return { ok: true };
  }

  return { ok: false, error: 'Loại bài viết không hợp lệ' };
}
