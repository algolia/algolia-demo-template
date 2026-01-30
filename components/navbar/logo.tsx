import Image from "next/image";

export function Logo() {
  return (
    <Image
      src="https://www.hsnstore.com/skin/frontend/default/hsnreborn/images/logoHSNReduced.svg"
      alt="HSN Store"
      width={120}
      height={40}
      priority
    />
  );
}
