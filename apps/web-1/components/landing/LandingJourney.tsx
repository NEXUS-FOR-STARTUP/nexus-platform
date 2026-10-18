import { ChartLine, Landmark, Layers, Lightbulb, type LucideIcon } from "lucide-react";
import base from "./landing.module.css";
import s from "./landingSections.module.css";

interface Stage {
  title: string;
  text?: string;
  Icon: LucideIcon;
  numClass: string;
  soon?: boolean;
}

const STAGES: Stage[] = [
  { title: "Ý tưởng", text: "Làm rõ ý tưởng, đối tượng khách hàng và giá trị cốt lõi.", Icon: Lightbulb, numClass: s.n1 },
  { title: "Thị trường", text: "Phân tích thị trường, đối thủ và xác thực nhu cầu.", Icon: ChartLine, numClass: s.n2 },
  { title: "Sản phẩm & mô hình", text: "Định hình sản phẩm, mô hình vận hành và lộ trình phát triển.", Icon: Layers, numClass: s.n3 },
  { title: "Gọi vốn & tài chính", Icon: Landmark, numClass: s.n4, soon: true },
];

export default function LandingJourney() {
  return (
    <section className={base.section}>
      <div className={base.wrap}>
        <div className={base.head}>
          <span className={base.chip}>Hành trình</span>
          <h2 className={base.title}>Bốn giai đoạn, từng bước một</h2>
        </div>
        <div className={s.stages}>
          {STAGES.map(({ title, text, Icon, numClass, soon }, i) => (
            <article key={title} className={`${s.stage} ${soon ? s.soon : ""}`}>
              <Icon size={24} className={s.stageIc} aria-hidden="true" />
              <span className={`${s.num} ${numClass}`}>{i + 1}</span>
              <h3>{title}</h3>
              {text ? <p>{text}</p> : <span className={s.tag}>Sắp ra mắt</span>}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
