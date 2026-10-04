import type { ReactNode } from "react";
import SettingsLayout from "./_components/SettingsLayout";

export default function DashboardSettingsLayout({ children }: { children: ReactNode }) {
  return <SettingsLayout>{children}</SettingsLayout>;
}
