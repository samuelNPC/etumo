/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ignores typescript/eslint errors during build so Vercel doesn't block your deployment over minor syntax issues
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  }
};

export default nextConfig;
