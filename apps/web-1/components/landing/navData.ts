import { BookOpen, CircleHelp, FileText, Receipt, Scale, ShieldCheck, Workflow, type LucideIcon } from "lucide-react";

export interface NavLink {
  href: string;
  label: string;
  Icon: LucideIcon;
}

export interface NavColumn {
  title: string;
  links: NavLink[];
}

export interface NavPromo {
  title: string;
  text: string;
  href: string;
}

export interface NavGroup {
  label: string;
  columns: NavColumn[];
  promo?: NavPromo;
}

/** Group pages by purpose; add new pages to an existing column before creating a group. */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Sản phẩm",
    columns: [
      {
        title: "Tìm hiểu Nexus",
        links: [
          { href: "/#quy-trinh", label: "Quy trình đánh giá", Icon: Workflow },
          { href: "/#pricing", label: "Bảng giá", Icon: Receipt },
        ],
      },
    ],
    promo: {
      title: "Kiểm tra nhanh ý tưởng",
      text: "Điền mẫu ý tưởng và nhận phản biện đầu tiên miễn phí.",
      href: "/dashboard",
    },
  },
  {
    label: "Tài nguyên",
    columns: [
      {
        title: "Học và hỏi",
        links: [
          { href: "/news", label: "Bài viết hướng dẫn", Icon: BookOpen },
          { href: "/#faq", label: "Câu hỏi thường gặp", Icon: CircleHelp },
        ],
      },
    ],
  },
  {
    label: "Chính sách",
    columns: [
      {
        title: "Pháp lý",
        links: [
          { href: "/privacy", label: "Chính sách bảo mật", Icon: ShieldCheck },
          { href: "/terms", label: "Điều khoản sử dụng", Icon: FileText },
        ],
      },
      {
        title: "Thanh toán và sử dụng",
        links: [
          { href: "/refund-policy", label: "Thanh toán & Hoàn tiền", Icon: Receipt },
          { href: "/fair-use-policy", label: "Quy chế & Fair-Use", Icon: Scale },
        ],
      },
    ],
  },
];

export const NAV_DIRECT_LINKS = [{ href: "/#lien-he", label: "Liên hệ" }] as const;
