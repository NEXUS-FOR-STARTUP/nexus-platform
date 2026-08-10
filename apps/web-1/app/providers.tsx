"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// Devtools — disabled on prod
// import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
// import { TanStackDevtools } from "@tanstack/react-devtools";
// import { formDevtoolsPlugin } from "@tanstack/react-form-devtools";
import { createTheme, MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";

const theme = createTheme({
  primaryColor: "brand",
  colors: {
    brand: [
      "#eff6ff", // 50
      "#dbeafe", // 100
      "#bfdbfe", // 200
      "#93c5fd", // 300
      "#60a5fa", // 400
      "#3b82f6", // 500
      "#2563eb", // 600
      "#1d4ed8", // 700
      "#1e40af", // 800
      "#1e3a8a", // 900
    ],
  },
  fontFamily: "var(--font-google-sans-flex), sans-serif",
  // Nexus Type Scale v1 — see design-system/nexus-platform/typography.md
  fontSizes: {
    xs: "0.75rem", // caption 12px
    sm: "0.875rem", // small 14px
    md: "1rem", // body 16px
    lg: "1.0625rem", // lead 17px
    xl: "1.125rem", // h4 18px
  },
  headings: {
    fontFamily: "var(--font-google-sans-flex), sans-serif",
    sizes: {
      h1: { fontSize: "2rem", lineHeight: "1.2", fontWeight: "700" },
      h2: { fontSize: "1.625rem", lineHeight: "1.25", fontWeight: "700" },
      h3: { fontSize: "1.375rem", lineHeight: "1.3", fontWeight: "600" },
      h4: { fontSize: "1.125rem", lineHeight: "1.4", fontWeight: "600" },
      h5: { fontSize: "1rem", lineHeight: "1.5", fontWeight: "600" },
      h6: { fontSize: "0.875rem", lineHeight: "1.5", fontWeight: "600" },
    },
  },
  components: {
    TextInput: { defaultProps: { size: "md" } },
    Textarea: { defaultProps: { size: "md" } },
    Select: { defaultProps: { size: "md" } },
    PasswordInput: { defaultProps: { size: "md" } },
    Button: { defaultProps: { size: "md" } },
  },
});

export default function Providers({ children }: { children: React.ReactNode }) {
  // Use React.useState to ensure that QueryClient is created once per session
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 0,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <NextThemesProvider attribute="data-mantine-color-scheme" defaultTheme="light" enableSystem>
        <MantineProvider theme={theme} defaultColorScheme="light">
          <Notifications position="top-right" zIndex={1000} />
          {children}
        </MantineProvider>
      </NextThemesProvider>
      {/* Devtools — chỉ bật khi dev
      <ReactQueryDevtools initialIsOpen={false} />
      <TanStackDevtools plugins={[formDevtoolsPlugin()]} />
      */}
    </QueryClientProvider>
  );
}
