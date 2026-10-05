import type { Metadata } from 'next';
import AppShell from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: {
    template: '%s | Nexus',
    default: 'Tin tức & Khởi nghiệp | Nexus',
  },
  description: 'Cập nhật tin tức, kinh nghiệm và chia sẻ thực chiến từ đội ngũ Nexus.',
};

export default function NewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
