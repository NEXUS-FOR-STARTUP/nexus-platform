"use client";

import React from "react";
import { Container, Title, Text, TextInput, Textarea, Button, Card, SimpleGrid, Group } from "@mantine/core";
import { Mail, Phone, Share2 } from "lucide-react";
import { notifications } from "@mantine/notifications";

export default function ContactUs() {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    notifications.show({
      title: "Chức năng đang phát triển",
      message: "Tính năng gửi liên hệ đang được phát triển. Vui lòng liên hệ trực tiếp qua Email hoặc Hotline bên cạnh.",
      color: "blue",
    });
    e.currentTarget.reset();
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-surface-soft/10 transition-colors duration-200">
      <Container size="lg" className="space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <Title order={2} className="font-heading text-3xl font-bold text-text-app">
            Liên hệ với chúng tôi
          </Title>
          <Text className="font-body text-text-muted">
            Mọi thắc mắc hoặc yêu cầu hỗ trợ đặc biệt, xin vui lòng gửi tin nhắn hoặc liên hệ trực tiếp.
          </Text>
        </div>

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
          {/* Info Card */}
          <Card p="lg" radius="lg" withBorder className="bg-surface-app border-border-app flex flex-col justify-between">
            <div className="space-y-6">
              <Title order={4} className="font-heading font-semibold text-text-app">
                Thông tin liên hệ
              </Title>
              <Text className="font-body text-text-muted">
                Nexus luôn sẵn sàng giải đáp và lắng nghe các phản hồi của bạn.
              </Text>

              <div className="space-y-4 pt-4 font-body">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-brand shrink-0" />
                  <div>
                    <div className="text-base text-text-muted font-semibold uppercase">Email</div>
                    <div className="text-xs text-text-app font-semibold">phungluuhoanglong@gmail.com</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-brand shrink-0" />
                  <div>
                    <div className="text-base text-text-muted font-semibold uppercase">Hotline</div>
                    <div className="text-xs text-text-app font-semibold">0776 506 822</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Share2 className="w-5 h-5 text-brand shrink-0" />
                  <div>
                    <div className="text-base text-text-muted font-semibold uppercase">Fanpage Facebook</div>
                    <a
                      href="https://www.facebook.com/profile.php?id=61591506814865"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-brand font-semibold hover:underline flex items-center gap-1"
                    >
                      <span>Nexus Platform</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Form Card */}
          <Card p="lg" radius="lg" withBorder className="bg-surface-app border-border-app">
            <form onSubmit={handleSubmit} className="space-y-4 font-body">
              <SimpleGrid cols={2}>
                <TextInput
                  label="Họ tên"
                  placeholder="Họ tên của bạn"
                  required
                  radius="md"
                />
                <TextInput
                  label="Email"
                  placeholder="email@example.com"
                  type="email"
                  required
                  radius="md"
                />
              </SimpleGrid>

              <TextInput
                label="Tiêu đề"
                placeholder="Lời nhắn về chủ đề gì?"
                required
                radius="md"
              />

              <Textarea
                label="Nội dung tin nhắn"
                placeholder="Viết lời nhắn của bạn ở đây..."
                minRows={4}
                required
                radius="md"
              />

              <Group justify="flex-end" className="pt-2">
                <Button type="submit" color="brand" radius="md" className="font-semibold cursor-pointer">
                  Gửi tin nhắn
                </Button>
              </Group>
            </form>
          </Card>
        </SimpleGrid>
      </Container>
    </section>
  );
}
