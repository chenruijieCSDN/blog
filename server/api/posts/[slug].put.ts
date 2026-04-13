import { PostStatus, Prisma } from "@prisma/client";
import { prisma } from "../../utils/prisma";
import { requireWritePassword } from "../../utils/auth";
import { uniqueTagSlug } from "../../utils/slug";

type UpdateBody = {
  password?: string;
  title?: string;
  content?: string;
  description?: string;
  location?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  status?: "draft" | "published";
  publishedAt?: string | null;
  tags?: string[];
};

async function reverseLocationFromLatLng(lat: number | null, lng: number | null) {
  if (lat === null || lng === null) return null;
  try {
    const data = await $fetch<{
      address?: {
        city?: string;
        town?: string;
        village?: string;
        county?: string;
        state?: string;
      };
    }>("https://nominatim.openstreetmap.org/reverse", {
      query: { format: "jsonv2", lat, lon: lng, "accept-language": "zh-CN" },
      headers: { "User-Agent": "PersonalBlog/1.0" },
    });
    return (
      data?.address?.city ||
      data?.address?.town ||
      data?.address?.village ||
      data?.address?.county ||
      data?.address?.state ||
      null
    );
  } catch {
    return null;
  }
}

export default defineEventHandler(async (event) => {
  try {
    const slug = getRouterParam(event, "slug");
    if (!slug) throw createError({ statusCode: 400, statusMessage: "slug is required" });

    const body = (await requireWritePassword(event)) as UpdateBody;
    const title = String(body.title ?? "").trim();
    const content = String(body.content ?? "").trim();
    const locationInput = String(body.location ?? "").trim() || null;
    const latitude =
      body.latitude === "" || body.latitude === null || body.latitude === undefined
        ? null
        : Number(body.latitude);
    const longitude =
      body.longitude === "" || body.longitude === null || body.longitude === undefined
        ? null
        : Number(body.longitude);
    if (!title || !content) {
      throw createError({ statusCode: 400, statusMessage: "title and content are required" });
    }
    if (latitude !== null && Number.isNaN(latitude)) {
      throw createError({ statusCode: 400, statusMessage: "latitude must be a number" });
    }
    if (longitude !== null && Number.isNaN(longitude)) {
      throw createError({ statusCode: 400, statusMessage: "longitude must be a number" });
    }
    const location = locationInput || (await reverseLocationFromLatLng(latitude, longitude));

    const existing = await prisma.post.findUnique({ where: { slug } });
    if (!existing) throw createError({ statusCode: 404, statusMessage: "Post not found" });

    const status = body.status === "published" ? PostStatus.published : PostStatus.draft;
    const publishedAt =
      status === PostStatus.published
        ? body.publishedAt
          ? new Date(body.publishedAt)
          : existing.publishedAt ?? new Date()
        : null;
    const tags = Array.isArray(body.tags)
      ? [...new Set(body.tags.map((x) => String(x).trim()).filter(Boolean))]
      : [];

    const tagIds: number[] = [];
    for (const tagName of tags) {
      const tag =
        (await prisma.tag.findUnique({ where: { name: tagName } })) ??
        (await prisma.tag.create({ data: { name: tagName, slug: await uniqueTagSlug(prisma, tagName) } }));
      tagIds.push(tag.id);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const post = await tx.post.update({
        where: { id: existing.id },
        data: {
          title,
          content,
          description: String(body.description ?? "").trim() || null,
          location,
          latitude,
          longitude,
          status,
          publishedAt,
        },
      });
      await tx.postTag.deleteMany({ where: { postId: existing.id } });
      if (tagIds.length) {
        await tx.postTag.createMany({
          data: tagIds.map((tagId) => ({ postId: existing.id, tagId })),
          skipDuplicates: true,
        });
      }
      return post;
    });

    const withTags = await prisma.post.findUnique({
      where: { id: updated.id },
      include: { postTags: { include: { tag: true } } },
    });

    return {
      ok: true,
      data: {
        id: withTags!.id,
        title: withTags!.title,
        slug: withTags!.slug,
        description: withTags!.description,
        location: withTags!.location,
        latitude: withTags!.latitude,
        longitude: withTags!.longitude,
        status: withTags!.status,
        publishedAt: withTags!.publishedAt,
        tags: withTags!.postTags.map((x) => ({ name: x.tag.name, slug: x.tag.slug })),
      },
    };
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) throw error;
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw createError({ statusCode: 400, statusMessage: "database constraint failed" });
    }
    throw createError({ statusCode: 500, statusMessage: "Failed to update post" });
  }
});
