import type { H3Event } from "h3";

/**
 * Prefer live process.env (PM2 + ecosystem loads .env) over build-time runtimeConfig.
 */
export function getAdminPassword(event: H3Event) {
  const config = useRuntimeConfig(event);
  return String(
    process.env.ADMIN_PASSWORD ||
      process.env.NUXT_ADMIN_PASSWORD ||
      config.adminPassword ||
      "",
  );
}

export function getAdminSessionSecret(event: H3Event) {
  const config = useRuntimeConfig(event);
  return String(
    process.env.NUXT_ADMIN_SESSION_SECRET ||
      process.env.ADMIN_SESSION_SECRET ||
      config.adminSessionSecret ||
      "",
  );
}
