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

export interface PublicGradingPackage extends PublicPackage {
  service_code: string;
  features: string[];
}

/** `features` trong DB là mảng chuỗi hoặc `{ items: string[] }`; bỏ qua mọi dạng khác. */
function parseFeatureItems(raw: unknown): string[] {
  const list = Array.isArray(raw) ? raw : (raw as { items?: unknown } | null)?.items;
  return Array.isArray(list) ? list.filter((x): x is string => typeof x === "string" && x.trim() !== "") : [];
}

/**
 * Các gói chấm đang bán, từ `GET /api/packages` (public). Mỗi stage có `serviceType` ghép với gói cùng `service_type.code`.
 * Trả mảng rỗng khi API lỗi để trang vẫn render, không bịa số liệu.
 */
export async function getGradingPackages(): Promise<PublicGradingPackage[]> {
  const url = `${API_BASE_URL}/api/packages`;
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const data = (await res.json()) as Array<
      Partial<PublicPackage> & { features?: unknown; service_type?: { code?: string } | null }
    >;
    return data.flatMap((p) =>
      typeof p.name === "string" && typeof p.price === "number" && p.price > 0 && p.service_type?.code
        ? [{ name: p.name, price: p.price, credits_granted: p.credits_granted ?? null, service_code: p.service_type.code, features: parseFeatureItems(p.features) }]
        : [],
    );
  } catch (error) {
    console.error("[getGradingPackages] Không tải được danh sách gói chấm", { url, error });
    return [];
  }
}
