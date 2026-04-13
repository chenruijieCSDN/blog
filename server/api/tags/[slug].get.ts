import { prisma } from "../../utils/prisma";
import { toInt } from "../../utils/http";

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, "slug");
  if (!slug) throw createError({ statusCode: 400, statusMessage: "slug is required" });

  const q = getQuery(event);
  const page = toInt(q.page, 1, 1, 100000);
  const pageSize = toInt(q.pageSize, 10, 1, 100);

  const tag = await prisma.tag.findUnique({ where: { slug } });
  if (!tag) throw createError({ statusCode: 404, statusMessage: "Tag not found" });

  const [total, posts] = await Promise.all([
    prisma.post.count({
      where: { status: "published", postTags: { some: { tagId: tag.id } } },
    }),
    prisma.post.findMany({
      where: { status: "published", postTags: { some: { tagId: tag.id } } },
      include: { postTags: { include: { tag: true } } },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    ok: true,
    data: {
      tag: { id: tag.id, name: tag.name, slug: tag.slug },
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      items: posts.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        description: p.description,
        publishedAt: p.publishedAt,
        tags: p.postTags.map((x) => ({ name: x.tag.name, slug: x.tag.slug })),
      })),
    },
  };
});
