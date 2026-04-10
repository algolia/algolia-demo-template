import Image from "next/image";
import { DEMO_CONFIG } from "@/lib/demo-config";

export function Logo() {
  return (
    <>
      {/* Full logo on desktop */}
      <Image
        src={DEMO_CONFIG.brand.logoUrl}
        alt={DEMO_CONFIG.brand.name}
        width={DEMO_CONFIG.brand.logoWidth}
        height={DEMO_CONFIG.brand.logoHeight}
        priority
        className="hidden md:block"
      />
      {/* Icon only on mobile */}
      <Image
        src="/logo-icon.svg"
        alt={DEMO_CONFIG.brand.name}
        width={32}
        height={32}
        priority
        className="md:hidden"
      />
    </>
  );
}
