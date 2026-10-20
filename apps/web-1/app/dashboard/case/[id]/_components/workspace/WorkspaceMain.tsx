import type { ReactNode } from "react";
import classes from "./workspace-layout.module.css";

interface WorkspaceMainProps {
  width?: "col" | "narrow" | "wide";
  /** Changing this key remounts the content so it fades in again (tab or stage switch). */
  enterKey?: string;
  children: ReactNode;
}

export default function WorkspaceMain({ width = "col", enterKey, children }: WorkspaceMainProps) {
  return (
    <main className={classes.main}>
      <div key={enterKey} className={`${classes[width]} ${classes.enter}`}>
        {children}
      </div>
    </main>
  );
}
