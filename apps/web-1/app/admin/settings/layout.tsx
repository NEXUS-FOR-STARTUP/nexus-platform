import type { ReactNode } from "react";
import SettingsLayout from "../../dashboard/settings/_components/SettingsLayout";

export default function AdminSettingsLayout({ children }: { children: ReactNode }) {
  return <SettingsLayout basePath="/admin/settings">{children}</SettingsLayout>;
}
