export function useSiteUrlBase() {
  const config = useRuntimeConfig();
  return String(config.public.siteUrl || "").replace(/\/$/, "");
}

export function toAbsoluteUrl(path: string, base: string) {
  if (!path) return base;
  if (/^https?:\/\//i.test(path)) return path;
  return base + (path.startsWith("/") ? path : `/${path}`);
}

export function useAbsoluteUrl(path: string) {
  return toAbsoluteUrl(path, useSiteUrlBase());
}
