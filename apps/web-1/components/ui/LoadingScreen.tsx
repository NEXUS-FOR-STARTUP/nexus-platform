import { Loader } from "@mantine/core";

interface LoadingScreenProps {
  message?: string;
}

/** Full-screen gate while a role guard resolves (admin, supporter, writer). Flat: no card, glass or glow. */
export default function LoadingScreen({ message = "Đang xác thực tài khoản..." }: LoadingScreenProps) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-bg-app" role="status" aria-live="polite">
      <Loader color="brand" size="md" type="dots" />
      <p className="font-body text-sm text-text-muted">{message}</p>
    </div>
  );
}
