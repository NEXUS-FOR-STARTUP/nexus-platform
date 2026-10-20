import Link from "next/link";
import { ArrowRight, Check } from "@phosphor-icons/react/ssr";
import { MAX_TEAM_MEMBERS } from "@repo/validation";
import { formatPrice } from "@/lib/pricing";
import { getAuditPackage } from "@/lib/get-public-package";
import CountUp from "./CountUp";
import base from "./landing.module.css";
import s from "./landingSections.module.css";

/** Giá/thành viên tính theo nhóm đủ người, cùng quy ước với ServiceCheckoutModal. */
const PRICING_TEAM_SIZE = MAX_TEAM_MEMBERS;

const STATIC_FEATURES = [
  "Đánh giá theo 5 nhóm tiêu chí cốt lõi",
  "Phân loại vấn đề theo mức độ ưu tiên xử lý",
  "Kết quả thường có sau khoảng 10 phút",
];


export default async function LandingPricing() {
  const pkg = await getAuditPackage();
  const credits = pkg?.credits_granted ?? null;
  const features = [
    ...(credits ? [`${credits} lượt đánh giá tài liệu độc lập`] : []),
    ...STATIC_FEATURES,
    ...(pkg ? [`Chỉ ~${formatPrice(Math.round(pkg.price / PRICING_TEAM_SIZE))}/thành viên (nhóm ${PRICING_TEAM_SIZE} người)`] : []),
  ];
  return (
    <section className={`${base.section} ${base.soft}`} id="pricing">
      <div className={base.wrap}>
        <div className={base.head}>
          <h2 className={base.title}>Bảng giá dịch vụ</h2>
          <p>Chi phí minh bạch, tính theo gói đánh giá tài liệu cho cả nhóm.</p>
        </div>
        <div className={s.price}>
          {pkg && <h3>{pkg.name}</h3>}
          {pkg && (
            <div className={s.amount}>
              <CountUp value={pkg.price} />
              {credits ? <small>/ gói {credits} lượt</small> : null}
            </div>
          )}
          <p>Phù hợp cho nhóm cần rà soát tài liệu, nhận diện điểm yếu và đánh giá lại sau khi chỉnh sửa.</p>
          <ul>
            {features.map((f) => (
              <li key={f}>
                <Check size={22} aria-hidden="true" />
                {f}
              </li>
            ))}
          </ul>
          <Link
            href="/dashboard?create=1"
            className={`${base.btn} ${base.btnPrimary} ${base.btnBlock}`}
          >
            Tạo dự án
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
