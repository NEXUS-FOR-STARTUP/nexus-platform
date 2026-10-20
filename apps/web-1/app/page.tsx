import type { Metadata } from "next";
import LandingNav from "@/components/landing/LandingNav";
import LandingHero from "@/components/landing/LandingHero";
import LandingReport from "@/components/landing/LandingReport";
import LandingJourney from "@/components/landing/LandingJourney";
import LandingPricing from "@/components/landing/LandingPricing";
import LandingArticles from "@/components/landing/LandingArticles";
import FAQSection from "@/components/landing/FAQSection";
import ContactUs from "@/components/landing/ContactUs";
import LandingFooter from "@/components/landing/LandingFooter";
import LandingStickyCta from "@/components/landing/LandingStickyCta";
import base from "@/components/landing/landing.module.css";

const TITLE = "Nexus | Đánh giá và phản biện dự án khởi nghiệp";
const DESCRIPTION =
  "Nexus đưa dự án của nhóm bạn qua quy trình đánh giá có cấu trúc: phát hiện điểm thiếu logic, giả định chưa kiểm chứng và gợi ý hướng hoàn thiện trước khi trình bày.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    locale: "vi_VN",
    images: [{ url: "/landing/hero-poster.jpg", width: 1280, height: 720, alt: "Nexus" }],
  },
};

export default function Home() {
  return (
    <div className={base.landing}>
      <a className={base.skip} href="#main">
        Bỏ qua điều hướng
      </a>
      <LandingNav />
      <main id="main">
        <LandingHero />
        <LandingReport />
        <LandingJourney />
        <LandingPricing />
        <LandingArticles />
        <FAQSection />
        <ContactUs />
      </main>
      <LandingFooter />
      <LandingStickyCta />
    </div>
  );
}
