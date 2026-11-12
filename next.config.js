/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Ensure the app directory is used
  experimental: {
    appDir: true,
  },
}

module.exports = nextConfig
