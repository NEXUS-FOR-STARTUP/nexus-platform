import type { CSSProperties } from "react";
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

/** Entrance order of the hero blocks; the delay is applied by `.rise` in landingHero.module.css. */
const rise = (step: number) => ({ "--rise-step": step }) as CSSProperties;

export default function LandingHero() {
  return (
    <section className={s.hero} id="top">
      <HeroVideo className={s.heroBg} />
      <div className={`${base.wrap} ${s.heroGrid}`}>
        <div>
          <span className={`${base.chip} ${s.rise}`} style={rise(0)}>Phản biện dự án khởi nghiệp</span>
          <h1 className={`${s.h1} ${s.rise}`} style={rise(1)}>
            Đánh giá và phản biện <em>dự án khởi nghiệp</em>
          </h1>
          <p className={`${s.lead} ${s.rise}`} style={rise(2)}>
            Nexus đưa dự án của nhóm bạn qua quy trình đánh giá có cấu trúc - phát hiện điểm thiếu logic, nhận diện các giả định chưa kiểm chứng và gợi ý hướng hoàn thiện trước khi trình bày.
          </p>
          <ul className={`${s.points} ${s.rise}`} style={rise(3)}>
            {POINTS.map(([title, text]) => (
              <li key={title}>
                <CircleCheck size={22} aria-hidden="true" />
                <span>
                  <b>{title}</b> – {text}
                </span>
              </li>
            ))}
          </ul>
          <div className={`${s.ctaRow} ${s.rise}`} style={rise(4)} id={HERO_CTA_ID}>
            <Link href="/dashboard/team-fit?step=1" className={`${base.btn} ${base.btnPrimary}`} data-cta="free">
              Kiểm tra nhanh ý tưởng
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <a href="#pricing" className={`${base.btn} ${base.btnGhost}`} data-cta="paid">
              Xem bảng giá
            </a>
          </div>
        </div>
        <div className={s.rise} style={rise(5)}>
          <LandingQuestionCards />
        </div>
      </div>
    </section>
  );
}
