import Link from "next/link";
import { ArrowRight, Check } from "@phosphor-icons/react/ssr";
import { STAGES } from "@app/shared/stages";
import { formatPrice } from "@/lib/pricing";
import { getGradingPackages } from "@/lib/get-public-package";
import base from "./landing.module.css";
import s from "./landingSections.module.css";

/** Dự án mới luôn bắt đầu từ giai đoạn đầu; chỉ nút này nổi bật để người dùng biết bấm đâu trước. */
const ENTRY_STAGE_SLUG = STAGES[0].slug;

export default async function LandingPricing() {
  const packages = await getGradingPackages();
  const rows = STAGES.flatMap((stage) => {
    const pkg = stage.serviceType ? packages.find((p) => p.service_code === stage.serviceType) : undefined;
    return pkg ? [{ stage, pkg }] : [];
  });

  return (
    <section className={`${base.section} ${base.soft}`} id="pricing">
      <div className={base.wrap}>
        <div className={base.head}>
          <h2 className={base.title}>Bảng giá dịch vụ</h2>
          <p>Mỗi giai đoạn một gói chấm. Chỉ trả cho giai đoạn nhóm đang làm.</p>
        </div>
        {rows.length > 0 && (
          <>
            <div className={s.plans}>
              {rows.map(({ stage, pkg }) => (
                <article key={stage.slug} className={s.plan}>
                  <h3>{stage.name}</h3>
                  <div className={s.planPrice}>
                    {formatPrice(pkg.price)}
                    {pkg.credits_granted ? <small> / {pkg.credits_granted} lượt chấm</small> : null}
                  </div>
                  <ul>
                    {pkg.features.map((f) => (
                      <li key={f}>
                        <Check size={20} aria-hidden="true" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/dashboard?create=1" className={`${base.btn} ${stage.slug === ENTRY_STAGE_SLUG ? base.btnPrimary : base.btnGhost} ${base.btnBlock}`}>
                    Tạo dự án
                    <ArrowRight size={18} aria-hidden="true" />
                  </Link>
                </article>
              ))}
            </div>
            <p className={s.planNote}>Có thể chấm lại sau khi sửa bài. Kết quả thường có sau khoảng 10 phút.</p>
          </>
        )}
      </div>
    </section>
  );
}
