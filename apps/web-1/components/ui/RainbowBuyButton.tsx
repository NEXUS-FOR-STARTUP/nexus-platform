"use client";

import { Button, type MantineSize } from "@mantine/core";

interface RainbowBuyButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  size?: MantineSize | `compact-${MantineSize}` | string;
  fullWidth?: boolean;
  className?: string;
}

/**
 * The one flashy button in the product: every "buy credits" CTA.
 * Deep rainbow gradient + soft shimmer + drifting clouds. Text stays punchy
 * with a dark outline so it never washes out. No icons - the gradient speaks.
 * Everything else stays restrained; this button is the exception.
 */
export default function RainbowBuyButton({ children, ...props }: RainbowBuyButtonProps) {
  return (
    <>
      <Button
        {...props}
        className={`rainbow-buy-btn ${props.className ?? ""}`}
      >
        <span className="rainbow-stars" aria-hidden="true" />
        {children}
      </Button>
      <style>{`
        .rainbow-buy-btn {
          position: relative;
          overflow: hidden;
          border: none;
          color: #fff;
          font-weight: 800;
          letter-spacing: 0.01em;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.55), 0 0 12px rgba(0, 0, 0, 0.35);
          background: linear-gradient(110deg, #e0447c, #e8930c, #b8a900, #2f9e5f, #2470d6, #7a4fd0, #c2439e, #e0447c);
          background-size: 300% 100%;
          animation: rainbow-pan 6s linear infinite;
          box-shadow: 0 0 18px rgba(194, 67, 158, 0.5), 0 4px 14px rgba(36, 112, 214, 0.4);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .rainbow-buy-btn .mantine-Button-inner {
          position: relative;
          z-index: 1;
        }
        .rainbow-buy-btn[data-size="sm"] { height: 2.5rem; font-size: 0.875rem; padding-left: 1.1rem; padding-right: 1.1rem; }
        .rainbow-buy-btn[data-size="md"] { height: 3rem; font-size: 1rem; padding-left: 1.4rem; padding-right: 1.4rem; }
        .rainbow-buy-btn[data-size="lg"] { height: 3.75rem; font-size: 1.125rem; padding-left: 1.8rem; padding-right: 1.8rem; }
        .rainbow-buy-btn[data-size="xl"] { height: 4.5rem; font-size: 1.25rem; padding-left: 2.2rem; padding-right: 2.2rem; }
        .rainbow-buy-btn:not(:disabled):hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 0 32px rgba(194, 67, 158, 0.7), 0 8px 22px rgba(36, 112, 214, 0.55);
        }
        .rainbow-buy-btn:not(:disabled):active {
          transform: scale(0.98);
        }
        /* Meteor shower: 2 diagonal streaks falling top-right to bottom-left */
        .rainbow-buy-btn .rainbow-stars {
          position: absolute;
          inset: -40%;
          z-index: 1;
          pointer-events: none;
        }
        .rainbow-buy-btn .rainbow-stars::before,
        .rainbow-buy-btn .rainbow-stars::after {
          content: "";
          position: absolute;
          top: -10%;
          width: 2px;
          height: 56px;
          border-radius: 9999px;
          background: linear-gradient(to bottom, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.95));
          transform: rotate(28deg);
        }
        .rainbow-buy-btn .rainbow-stars::before {
          left: 30%;
          animation: meteor-fall 2.6s linear infinite;
        }
        .rainbow-buy-btn .rainbow-stars::after {
          left: 68%;
          animation: meteor-fall 3.4s linear 1.1s infinite;
        }
        .rainbow-buy-btn::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(115deg, transparent 35%, rgba(255, 255, 255, 0.45) 48%, rgba(255, 255, 255, 0.65) 50%, rgba(255, 255, 255, 0.45) 52%, transparent 65%);
          transform: translateX(-120%);
          animation: shimmer-sweep 3.2s ease-in-out infinite;
          pointer-events: none;
        }
        .rainbow-buy-btn::after {
          content: "";
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 60px 18px at 15% 80%, rgba(255, 255, 255, 0.28), transparent),
            radial-gradient(ellipse 80px 22px at 55% 20%, rgba(255, 255, 255, 0.22), transparent),
            radial-gradient(ellipse 70px 20px at 85% 75%, rgba(255, 255, 255, 0.25), transparent);
          animation: cloud-drift 7s ease-in-out infinite alternate;
          pointer-events: none;
        }
        .rainbow-buy-btn:disabled, .rainbow-buy-btn:disabled::before, .rainbow-buy-btn:disabled::after,
        .rainbow-buy-btn:disabled .rainbow-stars::before, .rainbow-buy-btn:disabled .rainbow-stars::after {
          animation: none;
        }
        .rainbow-buy-btn:disabled {
          filter: grayscale(0.6) brightness(0.85);
        }
        @keyframes rainbow-pan {
          0% { background-position: 0% 50%; }
          100% { background-position: 300% 50%; }
        }
        @keyframes shimmer-sweep {
          0% { transform: translateX(-120%); }
          55%, 100% { transform: translateX(120%); }
        }
        @keyframes cloud-drift {
          from { transform: translateX(-12px); opacity: 0.7; }
          to { transform: translateX(12px); opacity: 1; }
        }
        @keyframes meteor-fall {
          0% { transform: rotate(28deg) translate3d(0, -70px, 0); opacity: 0; }
          8% { opacity: 1; }
          70% { opacity: 1; }
          100% { transform: rotate(28deg) translate3d(-90px, 190px, 0); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .rainbow-buy-btn, .rainbow-buy-btn::before, .rainbow-buy-btn::after,
          .rainbow-buy-btn .rainbow-stars::before, .rainbow-buy-btn .rainbow-stars::after {
            animation: none;
          }
        }
      `}</style>
    </>
  );
}
