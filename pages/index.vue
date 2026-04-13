<template>
  <div class="mx-auto max-w-6xl px-5 md:px-8 lg:px-12">
    <section class="mx-auto max-w-3xl text-center">
      <p
        v-motion
        class="text-xs font-semibold uppercase tracking-[0.2em] text-fg-soft"
        :initial="{ opacity: 0, y: 16 }"
        :enter="{ opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } }"
      >
        独立开发者 · 界面与系统
      </p>
      <h1
        v-motion
        class="mt-6 text-5xl font-black tracking-tight text-fg md:text-6xl lg:text-7xl"
        :initial="{ opacity: 0, y: 28 }"
        :enter="{
          opacity: 1,
          y: 0,
          transition: { delay: 0.06, duration: 0.65, ease: [0.22, 1, 0.36, 1] },
        }"
      >
        柳树长青
      </h1>
      <p
        v-motion
        class="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-fg-soft md:text-xl"
        :initial="{ opacity: 0, y: 24 }"
        :enter="{
          opacity: 1,
          y: 0,
          transition: { delay: 0.12, duration: 0.65, ease: [0.22, 1, 0.36, 1] },
        }"
      >
        用克制的排版与动画，把复杂系统讲得像一首短诗。
      </p>
    </section>

    <section class="mt-20 md:mt-28">
      <div
        v-motion
        class="flex items-end justify-between gap-6"
        :initial="{ opacity: 0, y: 20 }"
        :enter="{
          opacity: 1,
          y: 0,
          transition: { delay: 0.18, duration: 0.55, ease: [0.22, 1, 0.36, 1] },
        }"
      >
        <h2 class="text-sm font-bold uppercase tracking-[0.18em] text-fg-soft">
          最新写作
        </h2>
        <NuxtLink
          to="/writing"
          class="text-sm font-semibold text-accent transition-colors hover:text-accent-amber"
        >
          查看全部
        </NuxtLink>
      </div>

      <div
        class="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8"
      >
        <div
          v-for="(post, i) in list"
          :key="post._path"
          v-motion
          :initial="{ opacity: 0, y: 32 }"
          :enter="{
            opacity: 1,
            y: 0,
            transition: {
              delay: 0.22 + i * 0.07,
              duration: 0.55,
              ease: [0.22, 1, 0.36, 1],
            },
          }"
        >
          <PostCard :post="post" />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  title: "首页",
});

const { public: pub } = useRuntimeConfig();

useHead({
  title: "首页",
});

useSeoMeta({
  title: "首页",
  description: "开发者作品与个人写作 — 极简排版",
  ogTitle: "首页",
  ogDescription: "开发者作品与个人写作 — 极简排版",
  ogImage: `${String(pub.siteUrl).replace(/\/$/, "")}/og-default.svg`,
  ogUrl: String(pub.siteUrl).replace(/\/$/, ""),
  twitterCard: "summary_large_image",
});

type HomePost = {
  _path: string;
  title: string;
  description?: string;
  date?: string;
  tags?: string[];
  cover?: string;
};

const { data: posts } = await useAsyncData("home-writing-latest", async () => {
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
  }>("/api/posts", { query: { status: "published", pageSize: 6 } });

  return res.data.items.map<HomePost>((p) => ({
    _path: `/writing/${p.slug}`,
    title: p.title,
    description: p.description ?? "",
    date: p.publishedAt ?? "",
    tags: p.tags.map((t) => t.name),
  }));
});

const list = computed(() => posts.value ?? []);
</script>
