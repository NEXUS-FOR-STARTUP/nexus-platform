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
  fontSizes: {
    xs: "1rem",
    sm: "1rem",
  },
  headings: {
    fontFamily: "var(--font-google-sans-flex), sans-serif",
    sizes: {
      h6: { fontSize: "1rem" },
    },
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
