"use client";

import { Container, Title, Text, Card, SimpleGrid, ThemeIcon, Group } from "@mantine/core";
import { Mail, Phone, Share2, ArrowUpRight } from "lucide-react";

export default function ContactUs() {
  const contactChannels = [
    {
      title: "Email",
      value: "phungluuhoanglong@gmail.com",
      href: "mailto:phungluuhoanglong@gmail.com",
      icon: Mail,
      color: "blue",
      actionText: "Gửi thư qua Email",
    },
    {
      title: "Hotline / Zalo",
      value: "0399 292 208",
      href: "tel:0399292208",
      icon: Phone,
      color: "teal",
      actionText: "Gọi điện hoặc nhắn tin",
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
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-surface-soft/10 transition-colors duration-200">
      <Container size="lg" className="space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <Title order={2} className="font-heading text-3xl font-bold text-text-app">
            Cần hỗ trợ hoặc đóng góp ý kiến?
          </Title>
          <Text className="font-body text-text-muted">
            Liên hệ trực tiếp với đội ngũ phát triển Nexus qua các kênh chính thức dưới đây.
          </Text>
        </div>

        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
          {contactChannels.map((channel, idx) => {
            const Icon = channel.icon;
            return (
              <Card
                key={idx}
                component="a"
                href={channel.href}
                target={channel.external ? "_blank" : undefined}
                rel={channel.external ? "noopener noreferrer" : undefined}
                p="xl"
                radius="lg"
                withBorder
                className="bg-surface-app border-border-app hover:border-brand/40 transition-all group flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <Group justify="space-between" align="center">
                    <ThemeIcon color={channel.color} size={44} radius="md" variant="light">
                      <Icon className="w-5 h-5" />
                    </ThemeIcon>
                    <ArrowUpRight className="w-4 h-4 text-text-muted group-hover:text-brand transition-colors" />
                  </Group>

                  <div>
                    <Text className="text-xs uppercase font-semibold text-text-muted font-body mb-1">
                      {channel.title}
                    </Text>
                    <Text className="text-base font-semibold text-text-app font-heading group-hover:text-brand transition-colors">
                      {channel.value}
                    </Text>
                  </div>
                </div>

                <Text className="text-xs text-brand font-medium font-body pt-4 border-t border-border-subtle mt-4">
                  {channel.actionText} →
                </Text>
              </Card>
            );
          })}
        </SimpleGrid>
      </Container>
    </section>
  );
}
