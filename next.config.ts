import { DEMO_CONFIG } from "./lib/demo-config";

const nextConfig = {
  images: {
    remotePatterns: DEMO_CONFIG.imageDomains,
  },
  async rewrites() {
    return [{ source: '/consum-proxy/:path*', destination: 'https://www.consum.es/:path*' }];
  },
};

export default nextConfig;
