<template>
  <div class="mx-auto max-w-3xl px-5 md:px-8 lg:px-12">
    <header>
      <p class="text-xs font-semibold uppercase tracking-[0.2em] text-fg-soft">
        Tag
      </p>
      <h1 class="mt-4 text-4xl font-black tracking-tight text-fg md:text-5xl">
        {{ decoded }}
      </h1>
      <p class="mt-4 text-fg-soft">{{ list.length }} 篇文章</p>
    </header>

    <ul class="mt-12 space-y-3" role="list">
      <li v-for="post in list" :key="post._path">
        <NuxtLink
          :to="post._path"
          class="group flex flex-col gap-1 rounded-[var(--radius-lg)] border border-edge bg-fg/[0.02] px-5 py-4 transition-all hover:border-white/10 hover:bg-fg/[0.04] md:flex-row md:items-center md:justify-between"
        >
          <span class="text-lg font-bold text-fg group-hover:text-accent">{{
            post.title
          }}</span>
          <time
            v-if="post.date"
            :datetime="String(post.date)"
            class="text-xs font-semibold uppercase tracking-[0.14em] text-fg-soft"
          >
            {{
              new Date(post.date).toLocaleDateString("zh-CN", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            }}
          </time>
        </NuxtLink>
      </li>
    </ul>

    <p v-if="!list.length" class="mt-12 text-center text-sm text-fg-soft">
      此标签下暂无文章。
    </p>

    <div class="mt-10">
      <NuxtLink
        to="/tags"
        class="text-sm font-semibold text-accent hover:text-accent-amber"
      >
        ← 全部标签
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const raw = computed(() => String(route.params.tag ?? ""));
const decoded = computed(() => {
  try {
    return decodeURIComponent(raw.value);
  } catch {
    return raw.value;
  }
});

type TagPost = {
  _path: string;
  title: string;
  date: string;
  tags: string[];
};

const { data: posts } = await useAsyncData(
  () => `tag-db-v2-${decoded.value}`,
  async () => {
    const res = await $fetch<{
      ok: boolean;
      data: {
        items: Array<{
          slug: string;
          title: string;
          publishedAt: string | null;
          tags: Array<{ name: string }>;
        }>;
      };
    }>("/api/posts", {
      query: { status: "published", tag: decoded.value, pageSize: 300 },
    });
    return res.data.items.map<TagPost>((p) => ({
      _path: `/writing/${p.slug}`,
      title: p.title,
      date: p.publishedAt ?? "",
      tags: p.tags.map((t) => t.name),
    }));
  },
  { getCachedData: () => undefined },
);

const list = computed(() => {
  return posts.value ?? [];
});

useHead({
  title: () => `标签：${decoded.value}`,
});

useSeoMeta({
  title: () => `标签：${decoded.value}`,
  description: () => `「${decoded.value}」主题下的文章列表`,
});
</script>
