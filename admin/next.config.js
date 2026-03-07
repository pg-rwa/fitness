/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  basePath: "/admin",
  async redirects() {
    return [
      {
        source: "/",
        destination: "/login",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    // API_BACKEND_URL is a runtime server-side env var for Docker/production.
    const backendUrl = process.env.API_BACKEND_URL || "http://localhost:3000/api";
    return {
      beforeFiles: [
        {
          source: "/api/:path*",
          destination: `${backendUrl}/:path*`,
          basePath: false,
        },
      ],
    };
  },
};

module.exports = nextConfig;
