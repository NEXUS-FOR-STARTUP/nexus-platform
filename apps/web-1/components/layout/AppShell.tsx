"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Group,
  Button,
  Divider,
  Burger,
  Drawer,
  ScrollArea,
  Anchor,
  ActionIcon,
  Container,
  Text,
  useMantineTheme,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import ThemeToggler from "../ui/ThemeToggler";
import Logo from "../ui/Logo";

const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

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



interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] =
    useDisclosure(false);



  const footerLinks = [
    { href: "/privacy", label: "Chính sách bảo mật" },
    { href: "/terms", label: "Điều khoản sử dụng" },
    { href: "/refund-policy", label: "Thanh toán & Hoàn tiền" },
    { href: "/fair-use-policy", label: "Quy chế & Fair-Use" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-bg-app transition-colors duration-200">
      {/* ── Header Mega Menu ── */}
      <header className="sticky top-0 z-50 border-b border-border-app bg-surface-app/80 backdrop-blur-md h-16">
        <div className="w-full h-full px-6">
          <div className="flex items-center justify-between h-full w-full">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center"
            >
              <Logo height={62} />
            </Link>



            {/* Desktop Actions */}
            <Group visibleFrom="md" gap={12}>
              <ThemeToggler />
              <Button
                component={Link}
                href="/auth"
                color="brand"
                radius="md"
                size="sm"
                className="font-semibold font-body"
              >
                Đăng nhập
              </Button>
            </Group>

            {/* Mobile Burger and Theme Toggle */}
            <Group hiddenFrom="md" gap={8}>
              <ThemeToggler />
              <Burger opened={drawerOpened} onClick={toggleDrawer} size="sm" />
            </Group>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <Drawer
        opened={drawerOpened}
        onClose={closeDrawer}
        size="100%"
        padding="md"
        title={
          <Link
            href="/"
            className="flex items-center"
            onClick={closeDrawer}
          >
            <Logo height={44} />
          </Link>
        }
        hiddenFrom="md"
        zIndex={1000}
      >
        <ScrollArea h="calc(100vh - 80px)" mx="-md">
          <Divider my="sm" />

          <div className="flex flex-col gap-3 px-4 pt-2 font-body">
            <Button
              component={Link}
              href="/auth"
              color="brand"
              radius="md"
              fullWidth
              size="md"
              onClick={closeDrawer}
              className="font-semibold"
            >
              Đăng nhập
            </Button>
          </div>
        </ScrollArea>
      </Drawer>

      {/* ── Main Content ── */}
      <main className="flex-grow">{children}</main>

      {/* ── Footer Centered ── */}
      <footer className="border-t border-border-app bg-surface-app py-12">
        <Container
          size="lg"
          className="flex flex-col items-center gap-6 text-center"
        >
          {/* Logo Centered */}
          <Link
            href="/"
            className="flex items-center"
          >
            <Logo height={44} />
          </Link>

          {/* Centered Navigation Links */}
          <Group gap="xl" justify="center" className="flex-wrap">
            {footerLinks.map((link) => (
              <Anchor
                component={Link}
                href={link.href}
                key={link.label}
                c="dimmed"
                className="font-body text-xs font-semibold hover:text-brand transition-colors no-underline"
              >
                {link.label}
              </Anchor>
            ))}
          </Group>

          <Group gap="xs" justify="center">
            <ActionIcon
              component="a"
              href="https://www.facebook.com/profile.php?id=61591506814865"
              target="_blank"
              rel="noopener noreferrer"
              size="xl"
              color="gray"
              variant="subtle"
              radius="xl"
              className="cursor-pointer"
              aria-label="Nexus Facebook Page"
            >
              <FacebookIcon className="w-6 h-6 text-brand" />
            </ActionIcon>
            <ActionIcon
              component="a"
              href="https://zalo.me/g/wgadhwpaxd05vykpnxqb"
              target="_blank"
              rel="noopener noreferrer"
              size="xl"
              color="gray"
              variant="subtle"
              radius="xl"
              className="cursor-pointer"
              aria-label="Nexus Zalo Group"
            >
              <Image
                src="/logo/zalo.png"
                alt="Zalo"
                width={24}
                height={24}
                className="w-6 h-6"
              />
            </ActionIcon>
            <ActionIcon
              component="a"
              href="https://www.tiktok.com/@nexus.for.startup?_r=1&_t=ZS-99uXWT84gk9"
              target="_blank"
              rel="noopener noreferrer"
              size="xl"
              color="gray"
              variant="subtle"
              radius="xl"
              className="cursor-pointer"
              aria-label="Nexus TikTok"
            >
              <TikTokIcon className="w-5 h-5 text-text-app hover:text-brand transition-colors" />
            </ActionIcon>
          </Group>

          {/* Copyright & Info */}
          <Text size="xs" c="dimmed" className="font-body">
            &copy; {new Date().getFullYear()} Nexus Platform. Tất cả quyền được
            bảo lưu.
          </Text>
        </Container>
      </footer>
    </div>
  );
}
