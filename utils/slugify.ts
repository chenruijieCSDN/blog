/** Safe filename slug for URLs / files (no slashes). */
export function slugifyForFile(input: string): string {
  const base = input
    .trim()
    .toLowerCase()
    .replace(/[\s/_]+/g, "-")
    .replace(/[^a-z0-9\u4e00-\u9fff-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 96);
  if (base.length > 0) return base;
  return `post-${Date.now()}`;
}
