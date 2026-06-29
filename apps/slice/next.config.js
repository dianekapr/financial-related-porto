/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@portfolio/supabase'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
}

module.exports = nextConfig