import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: "standalone", // Uncomment for Docker deployment
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '**',
      },
    ],
  },
};

export default nextConfig;
