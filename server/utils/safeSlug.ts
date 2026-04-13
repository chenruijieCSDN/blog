export function assertSafeWritingSlug(slug: string): void {
  if (!slug || slug.length > 120) {
    throw createError({ statusCode: 400, statusMessage: "Invalid slug" });
  }
  if (slug.includes("..") || slug.includes("/") || slug.includes("\\")) {
    throw createError({ statusCode: 400, statusMessage: "Invalid slug" });
  }
}
