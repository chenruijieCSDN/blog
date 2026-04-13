import type { PrismaClient } from "@prisma/client";

export function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\u4e00-\u9fff-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

export async function uniquePostSlug(prisma: PrismaClient, title: string) {
  const base = slugify(title) || `post-${Date.now()}`;
  let slug = base;
  let n = 2;
  while (await prisma.post.findUnique({ where: { slug } })) {
    slug = `${base}-${n}`;
    n += 1;
  }
  return slug;
}

export async function uniqueTagSlug(prisma: PrismaClient, name: string) {
  const base = slugify(name) || `tag-${Date.now()}`;
  let slug = base;
  let n = 2;
  while (await prisma.tag.findUnique({ where: { slug } })) {
    slug = `${base}-${n}`;
    n += 1;
  }
  return slug;
}
