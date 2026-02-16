import Image from "next/image";
import { DEMO_CONFIG } from "@/lib/demo-config";

export function Logo() {
  return (
    <Image
      src={DEMO_CONFIG.brand.logoUrl}
      alt={DEMO_CONFIG.brand.name}
      width={DEMO_CONFIG.brand.logoWidth}
      height={DEMO_CONFIG.brand.logoHeight}
      priority
    />
  );
}
