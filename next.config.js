/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // Tắt log build để có output sạch hơn
  silent: true,
  // Cấu hình logging để giảm noise
  logging: {
    fetches: {
      fullUrl: false
    }
  },
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