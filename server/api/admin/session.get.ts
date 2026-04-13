import { requireAdmin } from "../../utils/requireAdmin";

export default defineEventHandler((event) => {
  requireAdmin(event);
  return { ok: true };
});
