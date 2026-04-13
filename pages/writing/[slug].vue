<template>
  <div v-if="doc">
    <header class="mx-auto max-w-[1600px] px-4 md:px-6 lg:px-8">
      <div class="max-w-[88ch] border-b border-edge/80 pb-8">
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-fg-soft">Docs</p>
        <h1 class="mt-3 text-4xl font-black tracking-tight text-fg md:text-5xl">{{ doc.title }}</h1>
        <p v-if="doc.description" class="mt-4 text-base leading-relaxed text-fg-soft">{{ doc.description }}</p>
        <div class="mt-5 flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-fg-soft">
          <time v-if="doc.date" :datetime="String(doc.date)">
            {{
              new Date(doc.date).toLocaleDateString("zh-CN", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            }}
          </time>
          <span v-if="readingMinutes">· {{ readingMinutes }} 分钟阅读</span>
        </div>
        <div v-if="doc.tags?.length" class="mt-4">
          <TagCloud :tags="doc.tags" mode="page" />
        </div>
      </div>
    </header>

    <section class="mx-auto mt-10 max-w-[1600px] px-4 md:mt-12 md:px-6 lg:px-8">
      <div class="xl:grid xl:grid-cols-[280px_minmax(0,1fr)] xl:gap-8">
        <aside class="hidden xl:block">
          <nav
            v-if="tocItems.length"
            class="toc-panel sticky top-24 max-h-[calc(100vh-7rem)] overflow-auto rounded-xl border border-edge bg-fg/[0.02] p-4"
            aria-label="文章大纲"
          >
            <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-fg-soft">大纲</p>
            <ul class="mt-3 space-y-2 text-sm">
              <li v-for="group in tocTree" :key="group.id" class="toc-group">
                <details v-if="group.children.length">
                  <summary class="flex cursor-pointer list-none items-center gap-2 rounded-md px-1 py-1 text-fg-soft hover:bg-fg/[0.04] hover:text-fg">
                    <span class="toc-caret text-xs">▾</span>
                    <a
                      :href="`#${group.id}`"
                      class="min-w-0 flex-1 truncate whitespace-nowrap"
                      @click.stop
                    >
                      {{ group.text }}
                    </a>
                  </summary>
                  <ul v-if="group.children.length" class="mt-1 space-y-1">
                    <li v-for="child in group.children" :key="child.id">
                      <a
                        :href="`#${child.id}`"
                        class="block truncate whitespace-nowrap rounded-md px-1 py-1 text-fg-soft transition-colors hover:bg-fg/[0.04] hover:text-accent"
                      >
                        {{ child.text }}
                      </a>
                    </li>
                  </ul>
                </details>
                <a
                  v-else
                  :href="`#${group.id}`"
                  class="block truncate whitespace-nowrap rounded-md px-1 py-1 text-fg-soft transition-colors hover:bg-fg/[0.04] hover:text-accent"
                >
                  {{ group.text }}
                </a>
              </li>
            </ul>
          </nav>
        </aside>

        <div class="min-w-0">
          <article
            class="writing-body max-w-[88ch]"
            v-html="renderedHtml"
          />
        </div>
      </div>
    </section>

    <nav
      v-if="prev || next"
      class="mx-auto mt-16 flex max-w-[88ch] flex-col gap-4 border-t border-edge px-4 pt-10 md:flex-row md:justify-between md:px-6 lg:px-8"
      aria-label="相邻文章"
    >
      <NuxtLink
        v-if="prev"
        :to="prev._path"
        class="group max-w-md rounded-[var(--radius-lg)] border border-edge bg-fg/[0.02] p-4 transition-all hover:border-white/10 hover:bg-fg/[0.04]"
      >
        <span class="text-xs font-semibold uppercase tracking-[0.14em] text-fg-soft">
          上一篇
        </span>
        <p class="mt-1 font-bold text-fg group-hover:text-accent">
          {{ prev.title }}
        </p>
      </NuxtLink>
      <NuxtLink
        v-if="next"
        :to="next._path"
        class="group max-w-md rounded-[var(--radius-lg)] border border-edge bg-fg/[0.02] p-4 text-right transition-all hover:border-white/10 hover:bg-fg/[0.04] md:ml-auto"
      >
        <span class="text-xs font-semibold uppercase tracking-[0.14em] text-fg-soft">
          下一篇
        </span>
        <p class="mt-1 font-bold text-fg group-hover:text-accent">
          {{ next.title }}
        </p>
      </NuxtLink>
    </nav>

    <GiscusComments :comments="doc.comments === true" />
  </div>
</template>

<script setup lang="ts">
import { marked } from "marked";
import { estimateReadingMinutesFromText } from "~/utils/readingTime";

const route = useRoute();
const slug = String(route.params.slug);

type DbPost = {
  title: string;
  slug: string;
  content: string;
  description: string | null;
  status: "draft" | "published";
  publishedAt: string | null;
  tags: Array<{ name: string }>;
};

const { data: rawDoc } = await useAsyncData(`writing-${slug}`, async () => {
  const res = await $fetch<{ ok: boolean; data: DbPost }>(`/api/posts/${slug}`);
  return res.data;
});

const doc = computed(() => {
  if (!rawDoc.value) return null;
  return {
    _path: `/writing/${rawDoc.value.slug}`,
    title: rawDoc.value.title,
    description: rawDoc.value.description ?? "",
    date: rawDoc.value.publishedAt ?? "",
    tags: rawDoc.value.tags.map((t) => t.name),
    comments: true,
    content: rawDoc.value.content ?? "",
  };
});

if (!doc.value) {
  throw createError({ statusCode: 404, statusMessage: "文章未找到" });
}

const { data: series } = await useAsyncData("writing-series-nav", async () => {
  const res = await $fetch<{
    ok: boolean;
    data: {
      items: Array<{ slug: string; title: string; publishedAt: string | null }>;
    };
  }>("/api/posts", { query: { status: "published", pageSize: 100 } });
  return res.data.items.map((p) => ({
    _path: `/writing/${p.slug}`,
    title: p.title,
    date: p.publishedAt,
  }));
});

const neighbors = computed(() => {
  const list = (series.value ?? []) as {
    _path: string;
    title?: string;
  }[];
  const i = list.findIndex((p) => p._path === doc.value?._path);
  if (i < 0)
    return {
      prev: null as { _path: string; title?: string } | null,
      next: null as { _path: string; title?: string } | null,
    };
  return {
    prev: i > 0 ? list[i - 1] : null,
    next: i < list.length - 1 ? list[i + 1] : null,
  };
});

const prev = computed(() => neighbors.value.prev);
const next = computed(() => neighbors.value.next);
type TocItem = {
  id: string;
  text: string;
  level: number;
};
type TocGroup = {
  id: string;
  text: string;
  children: TocItem[];
};

function slugifyHeading(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/<[^>]*>/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-");
}

const tocItems = shallowRef<TocItem[]>([]);
const tocTree = shallowRef<TocGroup[]>([]);
const renderedHtml = shallowRef("");

function buildToc(content: string): TocItem[] {
  const lines = content.split(/\r?\n/);
  const seen = new Map<string, number>();
  const list: TocItem[] = [];
  for (const line of lines) {
    const m = line.match(/^(#{2,4})\s+(.+?)\s*$/);
    if (!m) continue;
    const level = m[1].length;
    const text = m[2].trim();
    const base = slugifyHeading(text) || `section-${list.length + 1}`;
    const used = seen.get(base) ?? 0;
    seen.set(base, used + 1);
    const id = used > 0 ? `${base}-${used}` : base;
    list.push({ id, text, level });
  }
  return list;
}

function buildTocTree(items: TocItem[]): TocGroup[] {
  const groups: TocGroup[] = [];
  let current: TocGroup | null = null;
  for (const item of items) {
    if (item.level === 2) {
      current = { id: item.id, text: item.text, children: [] };
      groups.push(current);
      continue;
    }
    if (!current) {
      current = { id: item.id, text: item.text, children: [] };
      groups.push(current);
      continue;
    }
    current.children.push(item);
  }
  return groups;
}

function injectHeadingIds(html: string, items: TocItem[]) {
  if (!items.length) return html;
  const queue = [...items];
  return html.replace(/<h([2-4])>([\s\S]*?)<\/h\1>/g, (match, levelStr, inner) => {
    const level = Number(levelStr);
    const next = queue[0];
    if (!next || next.level !== level) return match;
    queue.shift();
    return `<h${level} id="${next.id}">${inner}</h${level}>`;
  });
}

watch(
  () => doc.value?.content ?? "",
  (content) => {
    const items = buildToc(content);
    tocItems.value = items;
    tocTree.value = buildTocTree(items);
    const parsed = marked.parse(content) as string;
    renderedHtml.value = injectHeadingIds(parsed, items);
  },
  { immediate: true },
);

const readingMinutes = computed(() => {
  let text = doc.value?.content ?? "";
  if (!text.trim()) text = String(doc.value?.description ?? "");
  return estimateReadingMinutesFromText(text);
});

const siteUrlBase = useSiteUrlBase();
const canonical = computed(() => toAbsoluteUrl(doc.value?._path ?? "", siteUrlBase));
const ogImage = toAbsoluteUrl("/og-default.svg", siteUrlBase);

useSeoMeta({
  title: computed(() => String(doc.value?.title ?? "")),
  description: computed(() => String(doc.value?.description ?? "")),
  ogTitle: computed(() => String(doc.value?.title ?? "")),
  ogDescription: computed(() => String(doc.value?.description ?? "")),
  ogImage,
  ogUrl: computed(() => canonical.value),
  twitterCard: "summary_large_image",
});

useHead(() => ({
  title: doc.value?.title ? String(doc.value.title) : "文章",
  link: [{ rel: "canonical", href: canonical.value }],
}));
</script>
