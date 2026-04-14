import { toInt } from "../../utils/http";
import { prisma } from "../../utils/prisma";
import { throwFromPrismaError } from "../../utils/prismaErrors";

export default defineEventHandler(async (event) => {
  try {
    const q = getQuery(event);
    const page = toInt(q.page, 1, 1, 100000);
    const pageSize = toInt(q.pageSize, 10, 1, 100);
    const statusFilter = q.status === "published" || q.status === "draft" ? q.status : undefined;
    const tagFilter = q.tag ? String(q.tag) : undefined;

    const where = {
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(tagFilter
        ? {
            postTags: {
              some: {
                tag: { OR: [{ slug: tagFilter }, { name: tagFilter }] },
              },
            },
          }
        : {}),
    };

    const [total, posts] = await Promise.all([
      prisma.post.count({ where }),
      prisma.post.findMany({
        where,
        include: { postTags: { include: { tag: true } } },
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      ok: true,
      data: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
        items: posts.map((p: any) => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          description: p.description,
          location: p.location,
          latitude: p.latitude,
          longitude: p.longitude,
          status: p.status,
          publishedAt: p.publishedAt,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
          tags: p.postTags.map((x: any) => ({ id: x.tag.id, name: x.tag.name, slug: x.tag.slug })),
        })),
      },
    };
  } catch (error) {
    throwFromPrismaError(error, {
      logTag: "[api/posts]",
      failMessage: "Failed to load posts",
    });
  }
});
