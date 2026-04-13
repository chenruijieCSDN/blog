import type { H3Event } from "h3";
import { verifyAdminSession } from "./adminToken";

export function requireAdmin(event: H3Event) {
  const config = useRuntimeConfig(event);
  const token = getCookie(event, "admin_session");
  if (!verifyAdminSession(token, config.adminSessionSecret)) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }
}
