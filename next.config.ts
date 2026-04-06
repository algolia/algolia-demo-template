import { DEMO_CONFIG } from "./lib/demo-config";

const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: DEMO_CONFIG.imageDomains,
  },
};

export default nextConfig;
