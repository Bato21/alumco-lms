import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tree-shake icon barrel imports (lucide-react) → bundles más livianos.
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
