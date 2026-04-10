import { DEMO_CONFIG } from "./lib/demo-config";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig = {
  output: "standalone",
  basePath: basePath || undefined,
  images: {
    remotePatterns: DEMO_CONFIG.imageDomains,
  },
};

export default nextConfig;
