import React from "react";

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message = "Đang xác thực tài khoản..." }: LoadingScreenProps) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-bg-app transition-colors duration-300">
      <div className="flex flex-col items-center gap-5 p-8 rounded-2xl bg-surface-app/40 border border-border-app/60 backdrop-blur-md shadow-lg max-w-xs w-full text-center animate-fade-in">
        {/* Modern Spinner */}
        <div className="relative flex items-center justify-center w-14 h-14">
          {/* Inner pulsing glow */}
          <div className="absolute inset-0 rounded-full bg-brand/10 animate-ping opacity-75"></div>
          
          {/* SVG Spinner */}
          <svg
            className="animate-spin h-10 w-10 text-brand relative z-10"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3.5"
            ></circle>
            <path
              className="opacity-80"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>

        {/* Text info */}
        <div className="space-y-1">
          <p className="font-heading font-semibold text-xs text-text-app tracking-wide uppercase">
            Nexus Platform
          </p>
          <p className="font-body text-text-muted animate-pulse">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
