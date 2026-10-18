import { Mail, Phone, MessageCircle, Users, Video } from "lucide-react";
import { ZALO_GROUP_URL } from "@/lib/zalo";
import base from "./landing.module.css";
import s from "./landingSections.module.css";

const FACEBOOK_URL = "https://www.facebook.com/profile.php?id=61591506814865";
const TIKTOK_URL = "https://www.tiktok.com/@nexus.for.startup";
const CONTACT_EMAIL = "phungluuhoanglong@gmail.com";
const CONTACT_PHONE = "0776 506 822";

const CHANNELS = [
  { href: ZALO_GROUP_URL, label: "Tham gia nhóm Zalo hỗ trợ", Icon: MessageCircle },
  { href: FACEBOOK_URL, label: "Facebook Fanpage", Icon: Users },
  { href: TIKTOK_URL, label: "TikTok @nexus.for.startup", Icon: Video },
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
          {CHANNELS.map(({ href, label, Icon }) => (
            <a key={label} href={href} target="_blank" rel="noopener noreferrer" className={`${base.btn} ${s.channel}`}>
              <Icon size={18} aria-hidden="true" />
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
