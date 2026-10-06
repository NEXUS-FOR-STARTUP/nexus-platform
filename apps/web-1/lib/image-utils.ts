const OPTIMIZED_IMAGE_HOSTS = new Set([
  'res.cloudinary.com',
  'images.unsplash.com',
  'img.youtube.com',
  'i.ytimg.com',
  'static.vecteezy.com',
]);

/**
 * Kiểm tra xem URL ảnh có thuộc whitelist được Next.js tối ưu hóa qua server hay không.
 * Nếu không thuộc whitelist, ảnh sẽ được hiển thị với `unoptimized={true}` để trình duyệt
 * tải trực tiếp từ nguồn ngoài mà không gây quá tải server hoặc lỗi hostname.
 */
export function isOptimizedImageDomain(url?: string | null): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return OPTIMIZED_IMAGE_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}
