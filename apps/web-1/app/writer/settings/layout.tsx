import type { ReactNode } from "react";
import SettingsLayout from "../../dashboard/settings/_components/SettingsLayout";

export default function WriterSettingsLayout({ children }: { children: ReactNode }) {
  return <SettingsLayout basePath="/writer/settings">{children}</SettingsLayout>;
}
