import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_SERVER_API_URL}/:path*`
      },
    ];
  },
  allowedDevOrigins: ['192.168.5.182', 'localhost'],
};

export default nextConfig;
