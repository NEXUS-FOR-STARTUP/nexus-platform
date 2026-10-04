import React from "react";
import ThemeToggler from "../ui/ThemeToggler";

interface AuthShellProps {
  children: React.ReactNode;
}

export default function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="relative flex min-h-screen flex-col justify-center bg-bg-app px-4 py-12 transition-colors duration-200 sm:px-6 lg:px-8">
      {/* Top action bar for theme toggle */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <ThemeToggler />
      </div>

      <div className="mx-auto w-full max-w-[420px]">
        {/* Form Content */}
        <div className="rounded-2xl border border-border-app bg-surface-app p-6 sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}


