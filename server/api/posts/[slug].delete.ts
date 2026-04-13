import { prisma } from "../../utils/prisma";
import { requireWritePassword } from "../../utils/auth";

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, "slug");
  if (!slug) throw createError({ statusCode: 400, statusMessage: "slug is required" });
  await requireWritePassword(event);

  const existing = await prisma.post.findUnique({ where: { slug } });
  if (!existing) throw createError({ statusCode: 404, statusMessage: "Post not found" });

  await prisma.post.delete({ where: { id: existing.id } });
  return { ok: true, data: { slug } };
});
