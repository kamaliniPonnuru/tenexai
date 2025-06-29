import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  serverExternalPackages: ['pg'],
  images: {
    domains: ['localhost'],
  },
};

export default nextConfig;
