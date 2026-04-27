import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/cost',
        destination: '/software-cost',
        permanent: true,
      },
    ]
  },
};

export default nextConfig;
