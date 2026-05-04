import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8080/:path*'
      },
    ];
  },
  allowedDevOrigins: ['192.168.5.182', 'localhost'],
};

export default nextConfig;
