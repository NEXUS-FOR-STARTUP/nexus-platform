import Link from "next/link";
import { ArrowRight, CheckCircle as CircleCheck } from "@phosphor-icons/react/ssr";
import HeroVideo from "./HeroVideo";
import { LandingQuestionCards } from "./LandingQuestionCards";
import { HERO_CTA_ID } from "./landingConstants";
import base from "./landing.module.css";
import s from "./landingHero.module.css";

const POINTS = [
  ["Đánh giá có cấu trúc", "Báo cáo chi tiết chỉ ra các lỗ hổng lập luận và khoảng trống dữ liệu."],
  ["Định vị minh chứng", "Đối chiếu trực tiếp nhận xét với các phần nội dung liên quan trong tài liệu."],
  ["Ưu tiên hành động", "Phân loại rõ vấn đề cần xử lý trước và các gợi ý hoàn thiện thêm."],
];

export default function LandingHero() {
  return (
    <section className={s.hero} id="top">
      <HeroVideo className={s.heroBg} />
      <div className={`${base.wrap} ${s.heroGrid}`}>
        <div>
          <span className={base.chip}>Phản biện dự án khởi nghiệp</span>
          <h1 className={s.h1}>
            Đánh giá và phản biện <em>dự án khởi nghiệp</em>
          </h1>
          <p className={s.lead}>
            Nexus đưa dự án của nhóm bạn qua quy trình đánh giá có cấu trúc - phát hiện điểm thiếu logic, nhận diện các giả định chưa kiểm chứng và gợi ý hướng hoàn thiện trước khi trình bày.
          </p>
          <ul className={s.points}>
            {POINTS.map(([title, text]) => (
              <li key={title}>
                <CircleCheck size={22} aria-hidden="true" />
                <span>
                  <b>{title}</b> – {text}
                </span>
              </li>
            ))}
          </ul>
          <div className={s.ctaRow} id={HERO_CTA_ID}>
            <Link href="/dashboard" className={`${base.btn} ${base.btnPrimary}`} data-cta="free">
              Kiểm tra nhanh ý tưởng
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <a href="#pricing" className={`${base.btn} ${base.btnGhost}`} data-cta="paid">
              Xem bảng giá
            </a>
          </div>
        </div>
        <LandingQuestionCards />
      </div>
    </section>
  );
}
