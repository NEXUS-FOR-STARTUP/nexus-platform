import React from "react";
import Link from "next/link";
import ThemeToggler from "../ui/ThemeToggler";
import Logo from "../ui/Logo";

interface AuthShellProps {
  children: React.ReactNode;
}

export default function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="flex min-h-screen bg-bg-app transition-colors duration-200">
      {/* Top action bar for theme toggle */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <ThemeToggler />
      </div>

      <div className="flex flex-col justify-center flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-md">
          {/* Brand Logo */}
          <div className="flex justify-center mb-6">
            <Link href="/" className="inline-block hover:opacity-90 transition-opacity">
              <Logo height={38} />
            </Link>
          </div>

          {/* Form Content */}
          <div className="bg-surface-app py-8 px-5 border border-border-app rounded-xl shadow-xs sm:px-10">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
