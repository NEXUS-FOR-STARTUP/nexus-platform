"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// Devtools - disabled on prod
// import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
// import { TanStackDevtools } from "@tanstack/react-devtools";
// import { formDevtoolsPlugin } from "@tanstack/react-form-devtools";
import { Alert, createTheme, MantineProvider, type MantineColorsTuple } from "@mantine/core";
import { Info } from "@phosphor-icons/react";
import { Notifications } from "@mantine/notifications";

// Mantine needs parseable colours to build its shade ramps, so this is the one file that may hold hex.
// Every ramp mirrors a token family in globals.css (AGENTS.md > DESIGN SYSTEM). Change both together.
const NAVY: MantineColorsTuple = ["#EAEFF8", "#DBE4F3", "#BDCDEA", "#9FB4DC", "#5F83C4", "#2E5BAA", "#0B409E", "#09337D", "#072760", "#051C45"];

const theme = createTheme({
  primaryColor: "brand",
  // Filled shade 6 is the logo colour; dark uses 4 so navy stays readable (provisional until the dark pass).
  primaryShade: { light: 6, dark: 4 },
  // The logo greens/oranges are too light for white text, so let Mantine pick the text colour per fill.
  autoContrast: true,
  colors: {
    brand: NAVY,
    blue: NAVY,
    green: ["#E9F7ED", "#D8F1DF", "#B2E3BF", "#86D29B", "#52BF73", "#36B359", "#22AD46", "#1A8A38", "#166534", "#0F4A26"],
    teal: ["#E9F7ED", "#D8F1DF", "#B2E3BF", "#86D29B", "#52BF73", "#36B359", "#22AD46", "#1A8A38", "#166534", "#0F4A26"],
    orange: ["#FEF1E9", "#FDE5D3", "#FBCBA9", "#F9AD7C", "#F78F4F", "#F58038", "#F36F21", "#D95A12", "#9A3412", "#7C2A0E"],
    red: ["#FEF2F2", "#FEE2E2", "#FECACA", "#FCA5A5", "#F87171", "#F15555", "#EF4444", "#DC2626", "#991B1B", "#7F1D1D"],
    gray: ["#F8FAFC", "#F1F5F9", "#E2E8F0", "#CBD5E1", "#94A3B8", "#64748B", "#475569", "#334155", "#1E293B", "#0F172A"],
  },
  fontFamily: "var(--font-inter-tight), sans-serif",
  fontSizes: {
    xs: "var(--app-text-xs)",
    sm: "var(--app-text-sm)",
  },
  headings: {
    fontFamily: "var(--font-inter-tight), sans-serif",
    sizes: {
      h6: { fontSize: "1rem" },
    },
  },
  components: {
    // Mantine's Alert has no default icon; every alert shows the same Info icon unless it opts out.
    Alert: Alert.extend({ defaultProps: { icon: <Info className="w-4 h-4" /> } }),
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
      {/* Devtools - chỉ bật khi dev
      <ReactQueryDevtools initialIsOpen={false} />
      <TanStackDevtools plugins={[formDevtoolsPlugin()]} />
      */}
    </QueryClientProvider>
  );
}
