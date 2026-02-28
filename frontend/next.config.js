/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // standalone output is for Docker/self-hosted only (not compatible with Vercel)
  ...(!process.env.VERCEL && { output: "standalone" }),
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    // When NEXT_PUBLIC_API_URL is set, lib/api.js calls the API directly — no rewrite needed
    if (apiUrl) {
      return {
        beforeFiles: [
          {
            source: "/api/:path*",
            destination: `${apiUrl}/:path*`,
          },
        ],
      };
    }
    // Localhost proxy for Docker/local dev only
    if (!process.env.VERCEL) {
      return {
        beforeFiles: [
          {
            source: "/api/:path*",
            destination: "http://localhost:3000/api/:path*",
          },
        ],
      };
    }
    // On Vercel without NEXT_PUBLIC_API_URL — no rewrites (env var must be set!)
    return [];
  },
};

module.exports = nextConfig;
