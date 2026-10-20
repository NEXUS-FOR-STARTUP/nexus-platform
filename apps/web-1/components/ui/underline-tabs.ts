import type { TabsProps } from "@mantine/core";
import s from "./underline-tabs.module.css";

/** Pass as `classNames` to Mantine `<Tabs>` for the underline style. */
export const UNDERLINE_TABS_CLASSES: NonNullable<TabsProps["classNames"]> = {
  list: s.list,
  tab: s.tab,
};
