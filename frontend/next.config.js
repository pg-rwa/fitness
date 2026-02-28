/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // standalone output is for Docker/self-hosted only (not compatible with Vercel)
  ...(!process.env.VERCEL && { output: "standalone" }),
  async rewrites() {
    // Vercel: use server-side rewrite to proxy /api/* to backend
    // This avoids mixed-content (HTTPS frontend -> HTTP backend) browser blocks.
    // Set API_BACKEND_URL in Vercel env vars (NOT NEXT_PUBLIC_ — it's server-side only).
    if (process.env.VERCEL) {
      const backendUrl = process.env.API_BACKEND_URL;
      if (backendUrl) {
        return {
          beforeFiles: [
            {
              source: "/api/:path*",
              destination: `${backendUrl}/:path*`,
            },
          ],
        };
      }
      return [];
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    // Docker/self-hosted: when NEXT_PUBLIC_API_URL is set, lib/api.js calls the API directly
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
    // Local dev: proxy to localhost:3000
    return {
      beforeFiles: [
        {
          source: "/api/:path*",
          destination: "http://localhost:3000/api/:path*",
        },
      ],
    };
  },
};

module.exports = nextConfig;
