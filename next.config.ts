import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  remotePatterns: [
      {
        protocol: "https",
        hostname: "navajowhite-octopus-630288.hostingersite.com",
      },
    ],
  },
};

export default nextConfig;
