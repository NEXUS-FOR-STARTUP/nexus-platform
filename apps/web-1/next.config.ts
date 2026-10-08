import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.NODE_ENV === "production" ? "standalone" : undefined,
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 2592000,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
      {
        protocol: 'https',
        hostname: 'static.vecteezy.com',
      },
    ],
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
  turbopack: {
    root: path.resolve(import.meta.dirname ?? __dirname, "../../"),
    resolveAlias: {
      '@tiptap/pm/model': 'prosemirror-model',
      '@tiptap/pm/view': 'prosemirror-view',
      '@tiptap/pm/state': 'prosemirror-state',
      '@tiptap/pm/transform': 'prosemirror-transform',
    },
  },
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      '@tiptap/pm/model': 'prosemirror-model',
      '@tiptap/pm/view': 'prosemirror-view',
      '@tiptap/pm/state': 'prosemirror-state',
      '@tiptap/pm/transform': 'prosemirror-transform',
    };
    return config;
  },
};

export default nextConfig;
