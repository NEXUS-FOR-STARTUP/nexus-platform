"use client";

import { Container, Title, Text, Card, ThemeIcon, Group, Stack, Divider } from "@mantine/core";
import { Mail, Phone, Share2, Users, ArrowUpRight } from "lucide-react";

const TikTokIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
    fill="currentColor"
    {...props}
  >
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.68 6.34 6.34 0 0 0 9.35 22a6.34 6.34 0 0 0 6.33-6.32V8.84a8.21 8.21 0 0 0 4.91 1.62v-3.77h-1z" />
  </svg>
);

export default function ContactUs() {
  const contactChannels = [
    {
      title: "Email",
      value: "phungluuhoanglong@gmail.com",
      href: "mailto:phungluuhoanglong@gmail.com",
      icon: Mail,
      color: "blue",
      actionText: "Gửi email",
    },
    {
      title: "Số điện thoại",
      value: "0776 506 822",
      href: "tel:0776506822",
      icon: Phone,
      color: "teal",
      actionText: "Gọi điện",
    },
    {
      title: "Zalo Group",
      value: "Nhóm hỗ trợ Nexus",
      href: "https://zalo.me/g/wgadhwpaxd05vykpnxqb",
      icon: Users,
      color: "cyan",
      actionText: "Tham gia nhóm",
      external: true,
    },
    {
      title: "Facebook Fanpage",
      value: "Nexus Platform",
      href: "https://www.facebook.com/profile.php?id=61591506814865",
      icon: Share2,
      color: "indigo",
      actionText: "Truy cập Fanpage",
      external: true,
    },
    {
      title: "Kênh TikTok",
      value: "@nexus.for.startup",
      href: "https://www.tiktok.com/@nexus.for.startup?_r=1&_t=ZS-99uXWT84gk9",
      icon: TikTokIcon,
      color: "dark",
      actionText: "Xem TikTok",
      external: true,
    },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-surface-soft/10 transition-colors duration-200">
      <Container size="md" className="space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <Title order={2} className="font-heading text-3xl font-bold text-text-app">
            Cần hỗ trợ hoặc đóng góp ý kiến?
          </Title>
          <Text className="font-body text-text-muted">
            Liên hệ trực tiếp với đội ngũ phát triển Nexus qua các kênh chính thức dưới đây.
          </Text>
        </div>

        <Card p="xl" radius="lg" withBorder className="bg-surface-app border-border-app">
          <Stack gap={0}>
            {contactChannels.map((channel, idx) => {
              const Icon = channel.icon;
              return (
                <div key={idx}>
                  {idx > 0 && <Divider my="md" className="border-border-subtle" />}
                  <a
                    href={channel.href}
                    target={channel.external ? "_blank" : undefined}
                    rel={channel.external ? "noopener noreferrer" : undefined}
                    className="flex items-center justify-between gap-4 no-underline group"
                  >
                    <Group gap="md" align="center" wrap="nowrap" className="min-w-0">
                      <ThemeIcon color={channel.color} size={40} radius="md" variant="light" className="shrink-0">
                        <Icon className="w-5 h-5" />
                      </ThemeIcon>
                      <div className="min-w-0">
                        <Text className="text-xs font-medium text-text-muted font-body">
                          {channel.title}
                        </Text>
                        <Text className="text-sm font-semibold text-text-app font-heading group-hover:text-brand transition-colors truncate">
                          {channel.value}
                        </Text>
                      </div>
                    </Group>
                    <Group gap="xs" align="center" wrap="nowrap" className="shrink-0">
                      <Text className="text-xs text-brand font-medium font-body hidden sm:block">
                        {channel.actionText}
                      </Text>
                      <ArrowUpRight className="w-4 h-4 text-text-muted group-hover:text-brand transition-colors" />
                    </Group>
                  </a>
                </div>
              );
            })}
          </Stack>
        </Card>
      </Container>
    </section>
  );
}
