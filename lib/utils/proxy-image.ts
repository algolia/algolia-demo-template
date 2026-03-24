const CONSUM_ORIGIN = "https://www.consum.es";

export function proxyImageUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith(CONSUM_ORIGIN)) {
    return "/consum-proxy" + url.slice(CONSUM_ORIGIN.length);
  }
  return url;
}
