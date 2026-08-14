import type { ReactNode } from "react";
import SettingsLayout from "../../dashboard/settings/_components/SettingsLayout";

export default function SupporterSettingsLayout({ children }: { children: ReactNode }) {
  return <SettingsLayout basePath="/supporter/settings">{children}</SettingsLayout>;
}
