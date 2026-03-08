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

    // Docker/self-hosted: if API_BACKEND_URL is set, use it for rewrites.
    // In standalone mode, rewrites() is evaluated at build time and baked in,
    // so API_BACKEND_URL must be available at build time (as a Docker build arg).
    // If not set, skip rewrites — nginx handles /api/* routing in production.
    const backendUrl = process.env.API_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL;
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

    // SKIP_API_REWRITE=1 disables rewrites (used in Docker builds where
    // nginx handles /api/* routing and backend DNS isn't available at build time)
    if (process.env.SKIP_API_REWRITE === "1") {
      return [];
    }

    // Local dev: proxy to localhost:3000
    return {
      beforeFiles: [
        {
          source: "/api/:path*",
          destination: "http://localhost:3000/api/:path*",
        },
        {
          source: "/uploads/:path*",
          destination: "http://localhost:3000/uploads/:path*",
        },
      ],
    };
  },
};

module.exports = nextConfig;
