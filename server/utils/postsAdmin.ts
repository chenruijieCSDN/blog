import { mkdir, readFile, readdir, stat, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import matter from "gray-matter";
import { assertSafeWritingSlug } from "./safeSlug";

export const POSTS_DIR = join(process.cwd(), "content", "writing");

export type EditablePost = {
  slug: string;
  file: string;
  path: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  cover: string;
  location: string;
  latitude?: number;
  longitude?: number;
  comments: boolean;
  draft: boolean;
  body: string;
};

function yamlEscape(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\r?\n/g, " ");
}

export async function ensurePostsDir() {
  await mkdir(POSTS_DIR, { recursive: true });
}

export async function fileExists(path: string) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

export function toMarkdown(post: {
  title: string;
  description: string;
  date: string;
  tags: string[];
  draft: boolean;
  comments: boolean;
  cover?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  body: string;
}) {
  const tagLines =
    post.tags.length > 0
      ? `tags:\n${post.tags.map((t) => `  - "${yamlEscape(t)}"`).join("\n")}\n`
      : "tags: []\n";
  return [
    "---",
    `title: "${yamlEscape(post.title)}"`,
    `description: "${yamlEscape(post.description)}"`,
    `date: ${post.date}`,
    tagLines,
    `draft: ${post.draft ? "true" : "false"}`,
    `comments: ${post.comments ? "true" : "false"}`,
    post.cover ? `cover: "${yamlEscape(post.cover)}"` : "",
    post.location ? `location: "${yamlEscape(post.location)}"` : "",
    typeof post.latitude === "number" ? `latitude: ${post.latitude}` : "",
    typeof post.longitude === "number" ? `longitude: ${post.longitude}` : "",
    "---",
    "",
    post.body.trim(),
    "",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function listPostsBasic() {
  await ensurePostsDir();
  const files = (await readdir(POSTS_DIR)).filter((f) => f.endsWith(".md"));
  const out: Omit<EditablePost, "body">[] = [];
  for (const file of files) {
    const slug = file.replace(/\.md$/i, "");
    const raw = await readFile(join(POSTS_DIR, file), "utf8");
    const parsed = matter(raw);
    out.push({
      slug,
      file: `content/writing/${file}`,
      path: `/writing/${slug}`,
      title: String(parsed.data.title ?? slug),
      description: String(parsed.data.description ?? ""),
      date: String(parsed.data.date ?? ""),
      tags: Array.isArray(parsed.data.tags) ? parsed.data.tags.map(String) : [],
      cover: String(parsed.data.cover ?? ""),
      location: String(parsed.data.location ?? ""),
      latitude:
        typeof parsed.data.latitude === "number" ? Number(parsed.data.latitude) : undefined,
      longitude:
        typeof parsed.data.longitude === "number" ? Number(parsed.data.longitude) : undefined,
      comments: parsed.data.comments === true,
      draft: parsed.data.draft === true,
    });
  }
  return out.sort((a, b) => +new Date(b.date || 0) - +new Date(a.date || 0));
}

export async function readPostBySlug(slug: string): Promise<EditablePost> {
  assertSafeWritingSlug(slug);
  const full = join(POSTS_DIR, `${slug}.md`);
  if (!(await fileExists(full))) {
    throw createError({ statusCode: 404, statusMessage: "Post not found" });
  }
  const raw = await readFile(full, "utf8");
  const parsed = matter(raw);
  return {
    slug,
    file: `content/writing/${slug}.md`,
    path: `/writing/${slug}`,
    title: String(parsed.data.title ?? slug),
    description: String(parsed.data.description ?? ""),
    date: String(parsed.data.date ?? ""),
    tags: Array.isArray(parsed.data.tags) ? parsed.data.tags.map(String) : [],
    cover: String(parsed.data.cover ?? ""),
    location: String(parsed.data.location ?? ""),
    latitude: typeof parsed.data.latitude === "number" ? Number(parsed.data.latitude) : undefined,
    longitude:
      typeof parsed.data.longitude === "number" ? Number(parsed.data.longitude) : undefined,
    comments: parsed.data.comments === true,
    draft: parsed.data.draft === true,
    body: parsed.content.replace(/^\n+|\n+$/g, ""),
  };
}

export async function writePostBySlug(slug: string, markdown: string) {
  assertSafeWritingSlug(slug);
  await ensurePostsDir();
  await writeFile(join(POSTS_DIR, `${slug}.md`), markdown, "utf8");
}

export async function deletePostBySlug(slug: string) {
  assertSafeWritingSlug(slug);
  const full = join(POSTS_DIR, `${slug}.md`);
  if (!(await fileExists(full))) {
    throw createError({ statusCode: 404, statusMessage: "Post not found" });
  }
  await unlink(full);
}
