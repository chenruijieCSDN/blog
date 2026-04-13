<template>
  <div class="mx-auto max-w-3xl px-5 md:px-8 lg:px-12">
    <header class="max-w-xl">
      <p class="text-xs font-semibold uppercase tracking-[0.2em] text-fg-soft">
        Writing
      </p>
      <h1 class="mt-4 text-4xl font-black tracking-tight text-fg md:text-5xl">
        文章
      </h1>
      <p class="mt-4 text-base leading-relaxed text-fg-soft">
        以时间为序的笔记与长文。点击标签筛选，或浏览
        <NuxtLink to="/tags" class="font-semibold text-accent hover:text-accent-amber">
          全部标签
        </NuxtLink>
        。
      </p>
    </header>

    <section v-if="allTags.length" class="mt-10">
      <p class="text-xs font-semibold uppercase tracking-[0.18em] text-fg-soft">
        标签
      </p>
      <div class="mt-3 flex flex-wrap gap-2">
        <NuxtLink
          to="/writing"
          class="rounded-full border px-3 py-1 text-xs font-semibold transition-all"
          :class="
            !activeTag
              ? 'border-accent/50 bg-accent/10 text-accent'
              : 'border-edge text-fg-soft hover:border-white/10 hover:text-fg'
          "
        >
          全部
        </NuxtLink>
        <button
          v-for="t in allTags"
          :key="t"
          type="button"
          class="rounded-full border px-3 py-1 text-xs font-semibold transition-all"
          :class="
            activeTag === t
              ? 'border-accent/50 bg-accent/10 text-accent'
              : 'border-edge text-fg-soft hover:border-white/10 hover:text-fg'
          "
          @click="setTag(t)"
        >
          {{ t }}
        </button>
      </div>
    </section>

    <ul class="mt-14 space-y-3" role="list">
      <li v-for="(post, i) in filtered" :key="post._path">
        <div
          v-motion
          :initial="{ opacity: 0, y: 18 }"
          :enter="{
            opacity: 1,
            y: 0,
            transition: {
              delay: 0.05 * i,
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1],
            },
          }"
        >
          <NuxtLink
            :to="post._path"
            class="group flex flex-col gap-2 rounded-[var(--radius-lg)] border border-edge bg-fg/[0.02] px-5 py-4 transition-all duration-300 hover:scale-[1.01] hover:border-white/[0.08] hover:bg-fg/[0.04] hover:shadow-[0_24px_80px_-40px_var(--color-accent-glow)] md:flex-row md:items-baseline md:justify-between md:gap-8"
          >
            <div class="min-w-0 flex-1">
              <span
                class="text-lg font-bold tracking-tight text-fg transition-colors group-hover:text-accent"
              >
                {{ post.title }}
              </span>
              <div v-if="post.tags?.length" class="mt-2 flex flex-wrap gap-1.5">
                <button
                  v-for="tg in post.tags"
                  :key="tg"
                  type="button"
                  class="rounded-full border border-edge bg-fg/[0.03] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-fg-soft transition-colors hover:border-white/10 hover:text-accent"
                  @click.prevent.stop="filterByTag(String(tg))"
                >
                  {{ tg }}
                </button>
              </div>
            </div>
            <time
              v-if="post.date"
              :datetime="String(post.date)"
              class="shrink-0 text-xs font-semibold uppercase tracking-[0.14em] text-fg-soft group-hover:text-fg/80"
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
        </div>
      </li>
    </ul>

    <p v-if="!filtered.length" class="mt-12 text-center text-sm text-fg-soft">
      该标签下暂无文章。
    </p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  title: "文章",
});

useHead({
  title: "文章",
});

const route = useRoute();
const router = useRouter();

const activeTag = computed(() => {
  const t = route.query.tag;
  return t ? String(t) : "";
});

function setTag(tag: string) {
  router.push({ path: "/writing", query: { tag } });
}

function filterByTag(tag: string) {
  router.push({ path: "/writing", query: { tag } });
}

type WritingPost = {
  _path: string;
  title: string;
  date?: string;
  description?: string;
  tags?: string[];
};

const { data: posts } = await useAsyncData("writing-all-db-v2", async () => {
  const res = await $fetch<{
    ok: boolean;
    data: {
      items: Array<{
        slug: string;
        title: string;
        description: string | null;
        publishedAt: string | null;
        tags: Array<{ name: string }>;
      }>;
    };
  }>("/api/posts", { query: { status: "published", pageSize: 300 } });

  return res.data.items.map<WritingPost>((p) => ({
    _path: `/writing/${p.slug}`,
    title: p.title,
    date: p.publishedAt ?? "",
    description: p.description ?? "",
    tags: p.tags.map((t) => t.name),
  }));
}, { getCachedData: () => undefined });

const list = computed(() => posts.value ?? []);

const allTags = computed(() => {
  const s = new Set<string>();
  for (const p of list.value) {
    for (const t of p.tags ?? []) {
      if (t) s.add(String(t));
    }
  }
  return [...s].sort((a, b) => a.localeCompare(b, "zh-CN"));
});

const filtered = computed(() => {
  const tag = activeTag.value;
  if (!tag) return list.value;
  return list.value.filter((p) => (p.tags ?? []).map(String).includes(tag));
});
</script>
