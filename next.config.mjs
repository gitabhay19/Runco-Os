/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  // Disable webpack's filesystem cache in dev to avoid the Windows
  // "stale CSS hash" issue where the served HTML references a chunk
  // that webpack has invalidated but not regenerated.
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
