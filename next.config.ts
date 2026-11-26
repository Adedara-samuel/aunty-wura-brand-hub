import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every public page reads live content from MongoDB (and supports draft preview),
  // so the classic request-time rendering model is used instead of Cache Components.
  serverExternalPackages: ["@react-pdf/renderer", "mongodb", "bcryptjs"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/content-studio/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "no-store" },
        ],
      },
    ];
  },
};

export default nextConfig;
