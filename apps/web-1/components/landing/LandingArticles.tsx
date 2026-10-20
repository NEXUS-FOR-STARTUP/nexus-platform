import Image from "next/image";
import Link from "next/link";
import { getNewsCategoryName } from "@repo/validation";
import { fetchPublicNewsList } from "@/lib/news-server";
import { isOptimizedImageDomain } from "@/lib/image-utils";
import base from "./landing.module.css";
import s from "./landingSections.module.css";

const ARTICLE_COUNT = 3;
// Candidate pool: the API's default order is not contractual, so we pick the newest ourselves.
const ARTICLE_POOL = 12;

const DISPLAY_TZ = "Asia/Ho_Chi_Minh";

/** dd/MM/yyyy in Vietnam time so server timezone never shifts the day. */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { timeZone: DISPLAY_TZ });
}

/** Latest 3 published articles (open question 1 in the plan: chosen by recency, not fixed slugs). */
export default async function LandingArticles() {
  let items;
  try {
    const res = await fetchPublicNewsList({ type: "article", limit: ARTICLE_POOL });
    items = res.items
      .filter((i) => i.type === "article")
      .sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at))
      .slice(0, ARTICLE_COUNT);
  } catch (err) {
    console.error("[landing] Không tải được bài viết", err);
    return null;
  }
  if (!items.length) return null;

  return (
    <section className={base.section}>
      <div className={base.wrap}>
        <div className={base.head}>
          <span className={base.chip}>Đọc trước khi bắt đầu</span>
          <h2 className={base.title}>Bài viết hướng dẫn</h2>
        </div>
        <div className={s.arts}>
          {items.map((item) =>
            item.type === "article" ? (
              <Link key={item.id} href={`/news/${item.slug}`} className={s.art}>
                <div className={s.cover}>
                  {item.cover_image_url && (
                    <Image
                      src={item.cover_image_url}
                      alt={item.cover_image_alt || item.title}
                      fill
                      sizes="(max-width: 620px) 100vw, (max-width: 980px) 50vw, 380px"
                      unoptimized={!isOptimizedImageDomain(item.cover_image_url)}
                      style={{ objectFit: "cover" }}
                    />
                  )}
                </div>
                <div className={s.artBody}>
                  <div className={s.meta}>
                    <span className={s.cat}>{getNewsCategoryName(item.category)}</span>
                    <time dateTime={item.published_at}>{formatDate(item.published_at)}</time>
                  </div>
                  <strong>{item.title}</strong>
                  <span className={s.go}>Đọc thêm</span>
                </div>
              </Link>
            ) : null,
          )}
        </div>
      </div>
    </section>
  );
}
