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

    // Docker/self-hosted: API_BACKEND_URL is a runtime server-side env var
    // that tells Next.js where to proxy /api/* requests.
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
