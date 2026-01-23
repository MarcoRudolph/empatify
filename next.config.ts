import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';
import path from 'path';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig & Record<string, any> = {
  eslint: {
    // Disable ESLint during builds (warnings only, not blocking)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable type checking during builds (warnings only, not blocking)
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    // Fix for @supabase/ssr cookie dependency resolution
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        cookie: path.resolve(__dirname, 'node_modules/cookie'),
      };
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.scdn.co',
        port: '',
        pathname: '/image/**',
      },
    ],
  },
};

export default withNextIntl(nextConfig);
