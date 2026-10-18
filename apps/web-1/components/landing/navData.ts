export interface NavLink {
  href: string;
  label: string;
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

export interface NavDirect {
  href: string;
  label: string;
}

export type NavItem = NavGroup | NavDirect;

export const isGroup = (item: NavItem): item is NavGroup => "columns" in item;

/** Price and articles are top-level on purpose: they must be one click away. Group the rest by purpose. */
export const NAV_ITEMS: NavItem[] = [
  {
    label: "Sản phẩm",
    columns: [
      {
        title: "Tìm hiểu Nexus",
        links: [
          { href: "/#quy-trinh", label: "Quy trình đánh giá" },
          { href: "/#faq", label: "Câu hỏi thường gặp" },
        ],
      },
    ],
    promo: {
      title: "Kiểm tra nhanh ý tưởng",
      text: "Điền mẫu ý tưởng và nhận phản biện đầu tiên miễn phí.",
      href: "/dashboard",
    },
  },
  { href: "/#pricing", label: "Bảng giá" },
  { href: "/news", label: "Bài viết" },
  {
    label: "Chính sách",
    columns: [
      {
        title: "Pháp lý",
        links: [
          { href: "/privacy", label: "Chính sách bảo mật" },
          { href: "/terms", label: "Điều khoản sử dụng" },
        ],
      },
      {
        title: "Thanh toán và sử dụng",
        links: [
          { href: "/refund-policy", label: "Thanh toán & Hoàn tiền" },
          { href: "/fair-use-policy", label: "Quy chế & Fair-Use" },
        ],
      },
    ],
  },
  { href: "/#lien-he", label: "Liên hệ" },
];
