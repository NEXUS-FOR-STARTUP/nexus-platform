import { type Icon } from "@phosphor-icons/react";
import { ChartLine, Bank as Landmark, Stack as Layers, Lightbulb } from "@phosphor-icons/react/ssr";
import base from "./landing.module.css";
import s from "./landingSections.module.css";

interface Stage {
  title: string;
  text: string;
  Icon: Icon;
  numClass: string;
}

const STAGES: Stage[] = [
  { title: "Ý tưởng", text: "Làm rõ ý tưởng, đối tượng khách hàng và giá trị cốt lõi.", Icon: Lightbulb, numClass: s.n1 },
  { title: "Thị trường", text: "Phân tích thị trường, đối thủ và xác thực nhu cầu.", Icon: ChartLine, numClass: s.n2 },
  { title: "Mô hình kinh doanh", text: "Hoàn thiện mô hình kinh doanh, SWOT và chiến lược.", Icon: Layers, numClass: s.n3 },
  { title: "Tài chính & pitch", text: "Lập kế hoạch tài chính và soạn nội dung bài pitch 10 mục.", Icon: Landmark, numClass: s.n4 },
];

export default function LandingJourney() {
  return (
    <section className={base.section}>
      <div className={base.wrap}>
        <div className={base.head}>
          <span className={base.chip}>Hành trình</span>
          <h2 className={base.title}>Bốn giai đoạn, từng bước một</h2>
        </div>
        <div className={s.stages} data-stagger>
          {STAGES.map(({ title, text, Icon, numClass }, i) => (
            <article key={title} className={s.stage}>
              <Icon size={24} className={s.stageIc} aria-hidden="true" />
              <span className={`${s.num} ${numClass}`}>{i + 1}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
