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
          transition: { delay: 0.15, duration: 0.55, ease: [0.22, 1, 0.36, 1] },
        }"
      >
        <h2 class="text-sm font-bold uppercase tracking-[0.18em] text-fg-soft">
          作品集
        </h2>
      </div>

      <div class="mt-10 grid gap-6 lg:grid-cols-2 lg:gap-8">
        <article
          v-for="(project, i) in portfolioProjects"
          :key="project.name"
          v-motion
          class="rounded-2xl border border-edge bg-fg/[0.02] p-6 shadow-[0_24px_70px_-56px_var(--color-accent-glow)]"
          :initial="{ opacity: 0, y: 32 }"
          :enter="{
            opacity: 1,
            y: 0,
            transition: {
              delay: 0.18 + i * 0.07,
              duration: 0.55,
              ease: [0.22, 1, 0.36, 1],
            },
          }"
        >
          <div class="flex flex-wrap items-start justify-between gap-3">
            <h3 class="text-xl font-bold tracking-tight text-fg">
              {{ project.name }}
            </h3>
            <time class="text-xs font-semibold uppercase tracking-[0.12em] text-fg-soft">
              {{ project.period }}
            </time>
          </div>

          <div class="mt-3">
            <a
              :href="project.url"
              target="_blank"
              rel="noopener noreferrer"
              class="text-sm font-semibold text-accent transition-colors hover:text-accent-amber"
            >
              {{ project.url }}
            </a>
          </div>

          <p class="mt-4 text-sm leading-relaxed text-fg-soft">
            技术栈：{{ project.stack }}
          </p>

          <ul class="mt-4 space-y-2 text-sm leading-relaxed text-fg-soft">
            <li
              v-for="item in project.highlights"
              :key="item"
              class="flex gap-2"
            >
              <span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent/80" />
              <span>{{ item }}</span>
            </li>
          </ul>
        </article>
      </div>
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

type PortfolioProject = {
  name: string;
  url: string;
  period: string;
  stack: string;
  highlights: string[];
};

const portfolioProjects: PortfolioProject[] = [
  {
    name: "AI 超级智能体",
    url: "https://ai.crj-ai.top/api/",
    period: "2026.01 - 2026.02",
    stack: "Spring Boot + Spring AI + Prompt + RAG + MCP + Agent AI",
    highlights: [
      "设计并实现大模型驱动的智能 Agent 工作流，支持多轮对话、记忆持久化与 RAG 检索。",
      "基于 Spring AI 接入通义、Ollama 等模型并封装统一调用接口，实现大模型灵活切换。",
      "通过 MessageChatMemoryAdvisor 与 ChatMemory 保持多轮对话上下文连续性。",
      "参考 OpenManus/Manus 架构，自主实现 Agent 编排与工具调用逻辑。",
    ],
  },
  {
    name: "智能协同云图库",
    url: "https://yuntu.crj-ai.top/",
    period: "2026.02 - 2026.03",
    stack: "Vue3 + Spring Boot + MyBatis-Plus + MySQL + Redis + AI + WebSocket",
    highlights: [
      "基于自定义注解 + Spring AOP 实现统一权限校验，减少重复鉴权代码。",
      "使用 Redis + Caffeine 构建多级缓存，接口响应耗时降至原来的约 1/4。",
      "引入 Disruptor 异步消息机制，WebSocket 消息处理效率提升约 30%。",
    ],
  },
];

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
