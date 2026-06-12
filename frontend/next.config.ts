import type { NextConfig } from "next";

if (process.env.NODE_ENV === "development") {
  console.log(`
  \x1b[35m┌──────────────────────────────────────────────────────────┐\x1b[0m
  \x1b[35m│\x1b[0m                                                          \x1b[35m│\x1b[0m
  \x1b[35m│\x1b[0m   \x1b[1;35mBEM FT UNESA - PUBLIC PORTAL\x1b[0m   \x1b[90mv1.0\x1b[0m                    \x1b[35m│\x1b[0m
  \x1b[35m│\x1b[0m   \x1b[90m"Integrity & Innovation"\x1b[0m                               \x1b[35m│\x1b[0m
  \x1b[35m│\x1b[0m                                                          \x1b[35m│\x1b[0m
  \x1b[35m└──────────────────────────────────────────────────────────┘\x1b[0m
  `);
}
// import createNextIntlPlugin from 'next-intl/plugin';

// const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  transpilePackages: [
    "@bemft/api-client",
    "@bemft/permissions",
    "@bemft/types",
    "@bemft/utils",
    "@bemft/workflow",
  ],
  allowedDevOrigins: ["192.168.1.164"],
  images: {
    unoptimized: process.env.NODE_ENV === "development",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/photo-**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.bemftunesa.org";
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiUrl}/api/v1/:path*`,
      },
    ];
  },
  async headers() {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "https://api.bemftunesa.org";
    const apiURLObj = new URL(apiUrl);
    const apiHost = apiURLObj.host;
    const apiProto = apiURLObj.protocol;

    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "img-src 'self' data: https:",
      "font-src 'self' data: https:",
      "style-src 'self' 'unsafe-inline' https:",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
      `connect-src 'self' https: http://localhost:* http://127.0.0.1:* ws: wss: ${apiProto}//${apiHost}`,
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: csp,
          },
        ],
      },
    ];
  },
};

export default nextConfig; // Changed from withNextIntl(nextConfig)
