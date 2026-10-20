import { PACKAGE_KEYS } from "@/lib/pricing";

/** Server-side: ưu tiên URL nội bộ (container -> api), giống news-server.ts. */
const API_BASE_URL =
  process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const REVALIDATE_SECONDS = 300;
const FETCH_TIMEOUT_MS = 3000;

export interface PublicPackage {
  name: string;
  price: number;
  credits_granted: number | null;
}

/**
 * Tên, giá và số lượt của gói đánh giá tự động từ `GET /api/packages/:id` (public, không cần đăng nhập).
 * Trả `null` khi API lỗi để trang vẫn render, không bịa số liệu.
 */
export async function getAuditPackage(): Promise<PublicPackage | null> {
  const url = `${API_BASE_URL}/api/packages/${encodeURIComponent(PACKAGE_KEYS.AI_AUDIT)}`;
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const data = (await res.json()) as Partial<PublicPackage>;
    if (typeof data.name !== "string" || !data.name.trim() || typeof data.price !== "number" || data.price <= 0) {
      throw new Error("Dữ liệu gói không hợp lệ");
    }
    return { name: data.name, price: data.price, credits_granted: data.credits_granted ?? null };
  } catch (error) {
    console.error("[getAuditPackage] Không tải được gói chấm Ý tưởng", { url, error });
    return null;
  }
}
