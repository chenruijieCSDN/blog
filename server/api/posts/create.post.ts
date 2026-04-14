import { PostStatus, Prisma } from "@prisma/client";
import { requireWritePassword } from "../../utils/auth";
import { prisma } from "../../utils/prisma";
import { uniquePostSlug, uniqueTagSlug } from "../../utils/slug";

type CreateBody = {
  password?: string;
  title?: string;
  content?: string;
  description?: string;
  location?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  status?: "draft" | "published";
  publishedAt?: string;
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
    const body = (await requireWritePassword(event)) as CreateBody;
    const title = String(body.title ?? "").trim();
    const content = String(body.content ?? "").trim();
    const description = String(body.description ?? "").trim() || null;
    const locationInput = String(body.location ?? "").trim() || null;
    const latitude =
      body.latitude === "" || body.latitude === null || body.latitude === undefined
        ? null
        : Number(body.latitude);
    const longitude =
      body.longitude === "" || body.longitude === null || body.longitude === undefined
        ? null
        : Number(body.longitude);
    const status = body.status === "published" ? PostStatus.published : PostStatus.draft;
    const tags = Array.isArray(body.tags)
      ? [...new Set(body.tags.map((x) => String(x).trim()).filter(Boolean))]
      : [];

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

    const slug = await uniquePostSlug(prisma, title);
    const publishedAt =
      status === PostStatus.published
        ? body.publishedAt
          ? new Date(body.publishedAt)
          : new Date()
        : null;

    const tagConnect: { tag: { connect: { id: number } } }[] = [];
    for (const tagName of tags) {
      const existing = await prisma.tag.findUnique({ where: { name: tagName } });
      if (existing) {
        tagConnect.push({ tag: { connect: { id: existing.id } } });
      } else {
        const tag = await prisma.tag.create({
          data: { name: tagName, slug: await uniqueTagSlug(prisma, tagName) },
        });
        tagConnect.push({ tag: { connect: { id: tag.id } } });
      }
    }

    const post = await prisma.post.create({
      data: {
        title,
        slug,
        content,
        description,
        location,
        latitude,
        longitude,
        status,
        publishedAt,
        postTags: tagConnect.length ? { create: tagConnect } : undefined,
      },
      include: {
        postTags: { include: { tag: true } },
      },
    });

    return {
      ok: true,
      data: {
        id: post.id,
        title: post.title,
        slug: post.slug,
        description: post.description,
        location: post.location,
        latitude: post.latitude,
        longitude: post.longitude,
        status: post.status,
        publishedAt: post.publishedAt,
        tags: post.postTags.map((x) => ({ name: x.tag.name, slug: x.tag.slug })),
      },
    };
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) throw error;
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw createError({
        statusCode: 400,
        statusMessage: "database constraint failed",
        data: { code: error.code, hint: error.message.slice(0, 200) },
      });
    }
    const errName = error && typeof error === "object" ? (error as { name?: string }).name : "";
    if (errName === "PrismaClientInitializationError") {
      const hint = error instanceof Error ? error.message.slice(0, 200) : "unknown error";
      console.error("[api/posts/create]", error);
      throw createError({
        statusCode: 503,
        statusMessage: "Database connection failed",
        data: { hint },
      });
    }
    if (errName === "PrismaClientUnknownRequestError") {
      const hint = error instanceof Error ? error.message.slice(0, 200) : "unknown error";
      console.error("[api/posts/create]", error);
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to create post: ${hint}`,
        data: { hint },
      });
    }
    console.error("[api/posts/create]", error);
    const hint =
      error instanceof Error ? error.message.slice(0, 200) : "unknown error";
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to create post: ${hint}`,
      data: { hint },
    });
  }
});
