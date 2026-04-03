import { Product } from "@/lib/types/product";

export function getTopicLabel(page: Product): string {
  return page.ambitoLabel || page.ambito?.[0] || "";
}

export function getSiteBadge(page: Product): string {
  return page.siteLabel || page.siteDomain || "";
}
