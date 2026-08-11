"use client";

import React from "react";
import Logo from "./Logo";

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message = "Đang xác thực tài khoản..." }: LoadingScreenProps) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-bg-app transition-colors duration-300 p-4">
      <div className="flex flex-col items-center gap-8 p-10 sm:p-14 rounded-3xl bg-surface-app/70 border border-border-app/80 backdrop-blur-lg shadow-2xl max-w-xl w-full text-center animate-fade-in">
        {/* Brand Logo - Super Enlarged */}
        <div className="flex justify-center items-center py-2">
          <Logo height={120} className="h-28 sm:h-36 w-auto object-contain drop-shadow-md" />
        </div>

        {/* Modern Spinner - Scaled up */}
        <div className="relative flex items-center justify-center w-16 h-16">
          {/* Inner pulsing glow */}
          <div className="absolute inset-0 rounded-full bg-brand/15 animate-ping opacity-75"></div>
          
          {/* SVG Spinner */}
          <svg
            className="animate-spin h-12 w-12 text-brand relative z-10"
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

        {/* Text info - Larger font */}
        <div>
          <p className="font-body text-lg sm:text-xl font-semibold text-text-muted animate-pulse tracking-wide">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
