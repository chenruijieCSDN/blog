import { signAdminSession } from "../../utils/adminToken";
import { getAdminPassword, getAdminSessionSecret } from "../../utils/adminEnv";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const body = await readBody<{ password?: string }>(event).catch(() => ({}));
  const password = body.password ?? "";
  const expected = getAdminPassword(event);
  if (!expected) {
    throw createError({
      statusCode: 503,
      statusMessage: "Admin password not configured",
    });
  }
  if (password !== expected) {
    throw createError({ statusCode: 401, statusMessage: "Invalid password" });
  }
  const secret = getAdminSessionSecret(event) || config.adminSessionSecret;
  const token = signAdminSession(secret);
  setCookie(event, "admin_session", token, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60,
  });
  return { ok: true };
});
