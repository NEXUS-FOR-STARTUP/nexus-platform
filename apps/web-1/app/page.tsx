import AppShell from "@/components/layout/AppShell";
import LandingHero from "@/components/landing/LandingHero";
import FeaturesGrid from "@/components/landing/FeaturesGrid";
import FAQSection from "@/components/landing/FAQSection";
import ContactUs from "@/components/landing/ContactUs";

export default function Home() {
  return (
    <AppShell>
      <div className="flex flex-col w-full min-h-screen">
        <LandingHero />
        <FeaturesGrid />
        <FAQSection />
        <ContactUs />
      </div>
    </AppShell>
  );
}
