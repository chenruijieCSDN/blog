import { prisma } from "../../utils/prisma";

export default defineEventHandler(async () => {
  const tags = await prisma.tag.findMany({
    include: {
      postTags: { include: { post: { select: { status: true } } } },
    },
    orderBy: [{ name: "asc" }],
  });

  return {
    ok: true,
    data: tags.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      articleCount: t.postTags.filter((pt) => pt.post.status === "published").length,
    })),
  };
});
