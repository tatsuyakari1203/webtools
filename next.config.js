/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    outputFileTracingRoot: undefined,
  },
  // Tối ưu bundle size
  swcMinify: true,
  compress: true,
  // Loại bỏ source maps trong production
  productionBrowserSourceMaps: false,
}

module.exports = nextConfig