import { LandingReportSamples } from "./LandingReportSamples";
import base from "./landing.module.css";
import s from "./landingSections.module.css";

/** "Sau khi điền xong": wraps the draggable report stack (owned by the stack components). */
export default function LandingReport() {
  return (
    <section className={`${base.section} ${base.soft}`} id="quy-trinh">
      <div className={base.wrap}>
        <div className={base.head}>
          <span className={base.chip}>Sau khi điền xong</span>
          <h2 className={base.title}>Nexus phản biện lại</h2>
        </div>
        <div className={s.reportWrap}>
          <LandingReportSamples />
        </div>
      </div>
    </section>
  );
}
