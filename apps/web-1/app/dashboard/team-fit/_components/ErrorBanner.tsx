"use client";

interface ErrorBannerProps {
  errors: string[];
}

export default function ErrorBanner({ errors }: ErrorBannerProps) {
  if (errors.length === 0) return null;

  return (
    <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl">
      <p className="text-red-700 dark:text-red-400 font-semibold text-sm mb-2">
        Vui lòng sửa các lỗi sau:
      </p>
      <ul className="list-disc list-inside space-y-1">
        {errors.map((err, i) => (
          <li key={i} className="text-red-600 dark:text-red-400 text-xs">
            {err}
          </li>
        ))}
      </ul>
    </div>
  );
}
