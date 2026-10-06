import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.NODE_ENV === "production" ? "standalone" : undefined,
  transpilePackages: ["@repo/validation"],
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
      'prosemirror-model': path.resolve(import.meta.dirname ?? __dirname, '../../node_modules/prosemirror-model'),
      'prosemirror-view': path.resolve(import.meta.dirname ?? __dirname, '../../node_modules/prosemirror-view'),
      'prosemirror-state': path.resolve(import.meta.dirname ?? __dirname, '../../node_modules/prosemirror-state'),
      'prosemirror-transform': path.resolve(import.meta.dirname ?? __dirname, '../../node_modules/prosemirror-transform'),
      '@tiptap/pm/model': path.resolve(import.meta.dirname ?? __dirname, '../../node_modules/prosemirror-model'),
      '@tiptap/pm/view': path.resolve(import.meta.dirname ?? __dirname, '../../node_modules/prosemirror-view'),
      '@tiptap/pm/state': path.resolve(import.meta.dirname ?? __dirname, '../../node_modules/prosemirror-state'),
      '@tiptap/pm/transform': path.resolve(import.meta.dirname ?? __dirname, '../../node_modules/prosemirror-transform'),
    },
  },
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      'prosemirror-model': path.resolve(import.meta.dirname ?? __dirname, '../../node_modules/prosemirror-model'),
      'prosemirror-view': path.resolve(import.meta.dirname ?? __dirname, '../../node_modules/prosemirror-view'),
      'prosemirror-state': path.resolve(import.meta.dirname ?? __dirname, '../../node_modules/prosemirror-state'),
      'prosemirror-transform': path.resolve(import.meta.dirname ?? __dirname, '../../node_modules/prosemirror-transform'),
      '@tiptap/pm/model': path.resolve(import.meta.dirname ?? __dirname, '../../node_modules/prosemirror-model'),
      '@tiptap/pm/view': path.resolve(import.meta.dirname ?? __dirname, '../../node_modules/prosemirror-view'),
      '@tiptap/pm/state': path.resolve(import.meta.dirname ?? __dirname, '../../node_modules/prosemirror-state'),
      '@tiptap/pm/transform': path.resolve(import.meta.dirname ?? __dirname, '../../node_modules/prosemirror-transform'),
    };
    return config;
  },
};

export default nextConfig;
