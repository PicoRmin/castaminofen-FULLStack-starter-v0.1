/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@castaminofen/core', '@castaminofen/config', '@castaminofen/logger'],
};

export default nextConfig;
