import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { PACKAGE_KEYS, formatPrice } from "@/lib/pricing";
import base from "./landing.module.css";
import s from "./landingSections.module.css";

const AUDIT_PRICE_VND = 79000;

const FEATURES = [
  "2 lượt đánh giá tài liệu độc lập",
  "Đánh giá theo 5 nhóm tiêu chí cốt lõi",
  "Phân loại vấn đề theo mức độ ưu tiên xử lý",
  "Kết quả thường có sau khoảng 10 phút",
  "Chỉ ~16,000 VND/thành viên (nhóm 5 người)",
];

export default function LandingPricing() {
  return (
    <section className={`${base.section} ${base.soft}`} id="pricing">
      <div className={base.wrap}>
        <div className={base.head}>
          <h2 className={base.title}>Bảng giá dịch vụ</h2>
          <p>Chi phí minh bạch, tính theo gói đánh giá tài liệu cho cả nhóm.</p>
        </div>
        <div className={s.price}>
          <h3>Đánh giá Dự án Tự động</h3>
          <div className={s.amount}>
            {formatPrice(AUDIT_PRICE_VND)}
            <small>/ Bao gồm 2 lượt đánh giá</small>
          </div>
          <p>Phù hợp cho nhóm cần rà soát tài liệu, nhận diện điểm yếu và đánh giá lại sau khi chỉnh sửa.</p>
          <ul>
            {FEATURES.map((f) => (
              <li key={f}>
                <Check size={22} aria-hidden="true" />
                {f}
              </li>
            ))}
          </ul>
          <Link
            href={`/dashboard/intake?packageId=${PACKAGE_KEYS.AI_AUDIT}`}
            className={`${base.btn} ${base.btnPrimary} ${base.btnBlock}`}
          >
            Bắt đầu đánh giá
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
