import type { H3Event } from "h3";
import { verifyAdminSession } from "./adminToken";
import { getAdminSessionSecret } from "./adminEnv";

export function requireAdmin(event: H3Event) {
  const config = useRuntimeConfig(event);
  const token = getCookie(event, "admin_session");
  const secret = getAdminSessionSecret(event) || config.adminSessionSecret;
  if (!verifyAdminSession(token, secret)) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }
}
