import type { H3Event } from "h3";
import { getAdminPassword } from "./adminEnv";

export async function requireWritePassword(event: H3Event) {
  const body = await readBody<{ password?: string }>(event).catch(() => ({}));
  const incoming = String(body.password ?? "");
  const expected = getAdminPassword(event);

  if (!expected) {
    throw createError({ statusCode: 503, statusMessage: "ADMIN_PASSWORD not configured" });
  }
  if (!incoming || incoming !== expected) {
    throw createError({ statusCode: 401, statusMessage: "Invalid admin password" });
  }
  return body;
}
