/** @type {import('next').NextConfig} */
const nextConfig = {
  // Minimal configuration to avoid workspace issues
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
