import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Optimize workspace file tracing root
  outputFileTracingRoot: path.join(__dirname),

  // Enable Gzip and Brotli compression
  compress: true,

  // Remove powered-by header for cleaner responses
  poweredByHeader: false,

  // Tree-shake and optimize heavy package imports
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@supabase/supabase-js",
      "@supabase/ssr",
      "clsx",
      "tailwind-merge",
    ],
  },

  // Image optimization with AVIF and WebP priority
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days cache
    remotePatterns: [
      {
        protocol: "https",
        hostname: "flagcdn.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "cbu01.alicdn.com",
      },
      {
        protocol: "https",
        hostname: "img.alicdn.com",
      },
    ],
  },

  // Long-term immutable caching headers for static assets
  async headers() {
    return [
      {
        source: "/:all*(svg|jpg|jpeg|png|webp|avif|ico|woff|woff2)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/manifest.webmanifest",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
