import type { ReactNode } from "react";
import classes from "./workspace-layout.module.css";

interface WorkspaceMainProps {
  width?: "col" | "narrow" | "wide";
  children: ReactNode;
}

export default function WorkspaceMain({ width = "col", children }: WorkspaceMainProps) {
  return (
    <main className={classes.main}>
      <div className={classes[width]}>{children}</div>
    </main>
  );
}
