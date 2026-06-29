/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@portfolio/supabase'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
}

module.exports = nextConfig
