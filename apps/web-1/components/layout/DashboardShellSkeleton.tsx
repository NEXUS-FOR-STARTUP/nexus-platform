import Link from "next/link";
import { Skeleton } from "@mantine/core";
import LoadingSkeleton from "../ui/LoadingSkeleton";
import Logo from "../ui/Logo";
import ThemeToggler from "../ui/ThemeToggler";

const AVATAR_SIZE = 36;
const PAGE_SKELETON_CARDS = 3;

/** Generic dashboard page body; also the route-level `loading.tsx` so the hand-off from the shell skeleton is seamless. */
export function DashboardPageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6" role="status" aria-busy="true" aria-label="Đang tải">
      <Skeleton height={32} width={240} radius="sm" />
      <LoadingSkeleton variant="card" count={PAGE_SKELETON_CARDS} />
    </div>
  );
}

/**
 * Shown while the session resolves: the real navbar frame (same classes as DashboardShell) with the
 * user-specific controls skeletonised, so the page does not swap from a centred spinner to the app layout.
 */
export default function DashboardShellSkeleton() {
  return (
    <div className="flex flex-col min-h-screen min-h-dvh bg-bg-app">
      <nav className="border-b border-border-app bg-surface-app sticky top-0 z-40 h-16 flex items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center shrink-0">
          <Logo height={62} />
        </Link>
        <div className="ml-auto flex items-center gap-4 shrink-0">
          <Skeleton height={AVATAR_SIZE} width={AVATAR_SIZE} circle />
          <ThemeToggler />
          <Skeleton height={AVATAR_SIZE} width={AVATAR_SIZE} circle />
        </div>
      </nav>
      <main className="flex-grow flex flex-col min-h-0">
        <DashboardPageSkeleton />
      </main>
    </div>
  );
}
