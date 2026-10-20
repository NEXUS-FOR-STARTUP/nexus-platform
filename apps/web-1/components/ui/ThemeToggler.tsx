"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { ActionIcon } from "@mantine/core";
import { Sun, Moon } from "@phosphor-icons/react";

export default function ThemeToggler() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <ActionIcon variant="subtle" color="gray" size="md" className="w-8 h-8 opacity-0" />;
  }

  const isDark = theme === "dark";

  return (
    <ActionIcon
      variant="subtle"
      color="gray"
      size="md"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="text-text-muted hover:text-brand transition-colors"
      aria-label="Toggle theme"
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </ActionIcon>
  );
}
