import Image from "next/image";
import { Mail, Phone } from "lucide-react";
import { ZALO_GROUP_URL } from "@/lib/zalo";
import base from "./landing.module.css";
import s from "./landingSections.module.css";

const FACEBOOK_URL = "https://www.facebook.com/profile.php?id=61591506814865";
const TIKTOK_URL = "https://www.tiktok.com/@nexus.for.startup";
const CONTACT_EMAIL = "phungluuhoanglong@gmail.com";
const CONTACT_PHONE = "0776 506 822";

const FacebookIcon = ({ size }: { size: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const CHANNELS = [
  { href: ZALO_GROUP_URL, label: "Tham gia nhóm Zalo hỗ trợ", icon: "/logo/zalo.png" },
  { href: FACEBOOK_URL, label: "Facebook Fanpage", Icon: FacebookIcon },
  { href: TIKTOK_URL, label: "TikTok @nexus.for.startup", icon: "/logo/tiktok.png" },
];

export default function ContactUs() {
  return (
    <section className={`${base.section} ${s.contact}`} id="lien-he">
      <div className={base.wrap}>
        <div className={base.head} style={{ marginBottom: 32 }}>
          <h2 className={base.title}>Cần hỗ trợ hoặc đóng góp ý kiến?</h2>
          <p>Liên hệ trực tiếp với đội ngũ phát triển Nexus qua các kênh chính thức dưới đây.</p>
        </div>
        <div className={s.channels}>
          {CHANNELS.map(({ href, label, icon, Icon }) => (
            <a key={label} href={href} target="_blank" rel="noopener noreferrer" className={`${base.btn} ${s.channel}`}>
              {icon ? (
                <Image src={icon} alt="" width={20} height={20} className={s.channelImg} />
              ) : (
                Icon && <Icon size={18} />
              )}
              {label}
            </a>
          ))}
        </div>
        <div className={s.links}>
          <a href={`mailto:${CONTACT_EMAIL}`}>
            <Mail size={18} aria-hidden="true" />
            {CONTACT_EMAIL}
          </a>
          <a href={`tel:${CONTACT_PHONE.replace(/\s/g, "")}`}>
            <Phone size={18} aria-hidden="true" />
            {CONTACT_PHONE}
          </a>
        </div>
      </div>
    </section>
  );
}
