import { DEMO_CONFIG } from "./lib/demo-config";

const nextConfig = {
  images: {
    remotePatterns: DEMO_CONFIG.imageDomains,
  },
};

export default nextConfig;
