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

/** Group pages by purpose; add new pages to an existing column before creating a group. */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Sản phẩm",
    columns: [
      {
        title: "Tìm hiểu Nexus",
        links: [
          { href: "/#quy-trinh", label: "Quy trình đánh giá" },
          { href: "/#pricing", label: "Bảng giá" },
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
          { href: "/news", label: "Bài viết hướng dẫn" },
          { href: "/#faq", label: "Câu hỏi thường gặp" },
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
];

export const NAV_DIRECT_LINKS = [{ href: "/#lien-he", label: "Liên hệ" }] as const;
