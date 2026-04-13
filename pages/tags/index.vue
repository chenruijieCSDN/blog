<template>
  <div class="mx-auto max-w-3xl px-5 md:px-8 lg:px-12">
    <header>
      <p class="text-xs font-semibold uppercase tracking-[0.2em] text-fg-soft">
        Tags
      </p>
      <h1 class="mt-4 text-4xl font-black tracking-tight text-fg md:text-5xl">
        标签
      </h1>
      <p class="mt-4 text-fg-soft">点击标签查看该主题下的全部文章。</p>
    </header>
    <div class="mt-12">
      <TagCloud v-if="tags.length" :tags="tags" mode="page" />
      <p v-else class="text-sm text-fg-soft">暂无标签。</p>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({ title: "标签" });

const { data: posts } = await useAsyncData("tags-index-db-v2", async () => {
  const res = await $fetch<{
    ok: boolean;
    data: {
      items: Array<{ tags: Array<{ name: string }> }>;
    };
  }>("/api/posts", { query: { status: "published", pageSize: 300 } });
  return res.data.items;
}, { getCachedData: () => undefined });

const tags = computed(() => {
  const s = new Set<string>();
  for (const p of (posts.value ?? [])) {
    for (const t of p.tags ?? []) {
      if (t?.name) s.add(String(t.name));
    }
  }
  return [...s].sort((a, b) => a.localeCompare(b, "zh-CN"));
});
</script>
