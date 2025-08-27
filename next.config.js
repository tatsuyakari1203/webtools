/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // Tối ưu bundle size
  swcMinify: true,
  compress: true,
  // Loại bỏ source maps trong production
  productionBrowserSourceMaps: false,
  // Cấu hình cho static export
  trailingSlash: true,
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig