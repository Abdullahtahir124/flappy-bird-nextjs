/** @type {import('next').NextConfig} */
const nextConfig = {
  // App directory is now stable in Next.js 14

  // Vercel deployment optimizations
  poweredByHeader: false,

  // Strict mode for better error detection during development
  reactStrictMode: true,

  // Compiler options for smaller bundle size
  compiler: {
    // Remove console.log calls in production
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error'] } : false,
  },
}

module.exports = nextConfig