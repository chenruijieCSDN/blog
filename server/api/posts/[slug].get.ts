import { prisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, "slug");
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: "slug is required" });
  }

  const post = await prisma.post.findUnique({
    where: { slug },
    include: { postTags: { include: { tag: true } } },
  });

  if (!post) {
    throw createError({ statusCode: 404, statusMessage: "Post not found" });
  }

  return {
    ok: true,
    data: {
      id: post.id,
      title: post.title,
      slug: post.slug,
      content: post.content,
      description: post.description,
      location: post.location,
      latitude: post.latitude,
      longitude: post.longitude,
      status: post.status,
      publishedAt: post.publishedAt,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      tags: post.postTags.map((x) => ({ id: x.tag.id, name: x.tag.name, slug: x.tag.slug })),
    },
  };
});
