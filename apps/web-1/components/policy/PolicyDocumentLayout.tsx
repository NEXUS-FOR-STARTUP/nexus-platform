"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Container,
  Title,
  Text,
  Anchor,
  Divider,
} from "@mantine/core";
import { ArrowLeft } from "lucide-react";
import AppShell from "@/components/layout/AppShell";

export interface TOCItem {
  id: string;
  title: string;
}

interface PolicyDocumentLayoutProps {
  title: string;
  subtitle?: string;
  effectiveDate: string;
  version: string;
  tocItems: TOCItem[];
  children: React.ReactNode;
}

export default function PolicyDocumentLayout({
  title,
  subtitle,
  effectiveDate,
  version,
  tocItems,
  children,
}: PolicyDocumentLayoutProps) {
  const [activeSection, setActiveSection] = useState<string>("");

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 120;
      for (let i = tocItems.length - 1; i >= 0; i--) {
        const element = document.getElementById(tocItems[i].id);
        if (element && element.offsetTop <= scrollPosition) {
          setActiveSection(tocItems[i].id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [tocItems]);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
      setActiveSection(id);
    }
  };

  return (
    <AppShell>
      <div className="w-full bg-bg-app min-h-screen py-10 md:py-16 transition-colors duration-200">
        <Container size="lg">
          {/* ── Document Header ── */}
          <div className="max-w-3xl mb-10 pb-8 border-b border-border-app">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-brand transition-colors no-underline font-body mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại trang chủ
            </Link>

            <Title
              order={1}
              className="font-display text-3xl md:text-4xl text-text-main font-bold tracking-tight mb-3"
            >
              {title}
            </Title>

            {subtitle && (
              <Text size="md" className="font-body text-text-muted mb-4 leading-relaxed">
                {subtitle}
              </Text>
            )}

            <div className="flex flex-col gap-y-1 text-xs text-text-muted font-body">
              <span>Cập nhật lần cuối: <strong>{effectiveDate}</strong></span>
              <span>Phiên bản: <strong>{version}</strong></span>
            </div>
          </div>

          {/* ── Document Body & Sticky Sidebar ── */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-12 lg:gap-16 items-start">
            {/* Main Editorial Text */}
            <article className="w-full max-w-3xl min-w-0 font-body text-text-main leading-relaxed text-[15px]">
              {children}
            </article>

            {/* Clean Sticky Sidebar Navigation */}
            <aside className="hidden lg:block sticky top-24 pl-4 border-l border-border-app">
              <Text size="xs" fw={700} className="font-display uppercase tracking-wider text-text-muted mb-3">
                Mục lục điều khoản
              </Text>

              <nav className="flex flex-col space-y-1.5 max-h-[calc(100vh-160px)] overflow-y-auto">
                {tocItems.map((item) => {
                  const isActive = activeSection === item.id;
                  return (
                    <Anchor
                      key={item.id}
                      href={`#${item.id}`}
                      onClick={(e) => scrollToSection(e, item.id)}
                      className={`text-xs py-1 transition-colors no-underline block ${
                        isActive
                          ? "text-brand font-semibold"
                          : "text-text-muted hover:text-text-main font-normal"
                      }`}
                    >
                      {item.title}
                    </Anchor>
                  );
                })}
              </nav>

              <Divider my="md" color="var(--mantine-color-default-border)" />

              <div className="text-xs text-text-muted font-body">
                <p className="mb-1">Cần hỗ trợ về điều khoản?</p>
                <a
                  href="mailto:contact@nexusplatform.vn"
                  className="text-brand font-medium hover:underline"
                >
                  contact@nexusplatform.vn
                </a>
              </div>
            </aside>
          </div>
        </Container>
      </div>
    </AppShell>
  );
}
