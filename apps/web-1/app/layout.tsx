import type { Metadata } from "next";
import { Inter_Tight, Merriweather } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { ColorSchemeScript } from "@mantine/core";

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

const merriweather = Merriweather({
  variable: "--font-merriweather",
  weight: ["300", "400", "700", "900"],
  style: ["normal", "italic"],
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nexus Platform",
  description: "Nền tảng kiểm định ý tưởng khởi nghiệp và phản biện học thuật thông minh",
  icons: {
    icon: "/logo/logo-icon-03.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${interTight.variable} ${merriweather.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <ColorSchemeScript defaultColorScheme="light" />
      </head>
      <body className="min-h-full flex flex-col bg-bg-app text-text-app">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
