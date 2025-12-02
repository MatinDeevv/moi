/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Only use rewrites in local development
  // For production (Vercel), set NEXT_PUBLIC_API_URL environment variable
  async rewrites() {
    // Skip rewrites in production (Vercel doesn't have access to localhost)
    if (process.env.NODE_ENV === 'production') {
      return [];
    }

    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/:path*',
      },
    ];
  },
};

module.exports = nextConfig;

