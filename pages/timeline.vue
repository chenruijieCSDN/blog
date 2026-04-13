<template>
  <div class="mx-auto max-w-3xl px-5 md:max-w-4xl md:px-8 lg:px-12">
    <header class="max-w-2xl">
      <p class="text-xs font-semibold uppercase tracking-[0.2em] text-fg-soft">
        Timeline
      </p>
      <h1 class="mt-4 text-4xl font-black tracking-tight text-fg md:text-5xl lg:text-6xl">
        时间轴
      </h1>
      <p class="mt-4 text-base leading-relaxed text-fg-soft md:text-lg">
        写作按年份汇流成一条垂直的记忆——悬停条目可预览语气，点击标题进入全文。
      </p>
    </header>

    <div v-if="!groups.length" class="mt-16 text-center text-sm text-fg-soft">
      暂无已发布文章。
    </div>

    <div v-else class="relative mt-16 md:mt-20">
      <!-- 桌面 / 平板：居中轴线 -->
      <div
        class="pointer-events-none absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-fg/12 to-transparent md:block"
        aria-hidden="true"
      />

      <section
        v-for="(group, gi) in groups"
        :key="group.year"
        class="relative mb-16 last:mb-0 md:mb-24"
      >
        <h2
          v-motion
          class="mb-8 text-center text-5xl font-black tracking-tight text-fg/90 md:mb-10 md:text-6xl lg:text-7xl"
          :initial="{ opacity: 0, y: 20 }"
          :enter="{
            opacity: 1,
            y: 0,
            transition: {
              delay: gi * 0.04,
              duration: 0.55,
              ease: [0.22, 1, 0.36, 1],
            },
          }"
        >
          {{ group.year }}
        </h2>

        <div class="relative">
          <!-- 移动端：左侧细线 -->
          <div
            class="absolute left-0 top-0 bottom-0 w-px bg-fg/10 md:hidden"
            aria-hidden="true"
          />

          <ul class="space-y-3 md:space-y-4" role="list">
            <li
              v-for="(post, pi) in group.posts"
              :key="post._path"
              v-motion
              class="relative md:grid md:grid-cols-2 md:gap-x-10"
              :initial="{ opacity: 0, y: 22 }"
              :enter="{
                opacity: 1,
                y: 0,
                transition: {
                  delay: 0.08 + gi * 0.05 + pi * 0.045,
                  duration: 0.5,
                  ease: [0.22, 1, 0.36, 1],
                },
              }"
            >
              <!-- 中轴节点（仅 md+） -->
              <div
                class="pointer-events-none absolute left-1/2 top-6 hidden h-2 w-2 -translate-x-1/2 rounded-full border border-edge bg-accent/40 shadow-[0_0_20px_var(--color-accent-glow)] md:block"
                aria-hidden="true"
              />

              <NuxtLink
                :to="post._path"
                class="group relative ml-5 block rounded-xl border border-transparent py-3 pl-1 outline-none transition-all duration-300 hover:-translate-y-0.5 hover:border-edge hover:bg-fg/[0.04] hover:shadow-[0_20px_60px_-40px_var(--color-accent-glow)] focus-visible:ring-2 focus-visible:ring-accent/40 md:ml-0 md:py-4 md:pl-4 md:pr-4"
                :class="pi % 2 === 0 ? 'md:col-start-1 md:text-right' : 'md:col-start-2 md:text-left'"
              >
                <time
                  :datetime="post.date"
                  class="text-xs font-semibold uppercase tracking-[0.16em] text-fg-soft group-hover:text-accent"
                >
                  {{ formatMd(post.date) }}
                </time>
                <h3
                  class="mt-2 text-lg font-bold tracking-tight text-fg transition-colors group-hover:text-accent md:text-xl"
                >
                  {{ post.title }}
                </h3>
                <p
                  v-if="post.description"
                  class="mt-2 line-clamp-2 text-sm leading-relaxed text-fg-soft group-hover:text-fg/85"
                >
                  {{ post.description }}
                </p>
              </NuxtLink>
            </li>
          </ul>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TimelineYearGroup } from "~/composables/usePosts";

definePageMeta({
  title: "时间轴",
});

useHead({ title: "时间轴" });

useSeoMeta({
  title: "时间轴",
  description: "按年份回顾全部文章写作历程",
});

const { data } = useTimelineGroups();
const groups = computed(() => (data.value ?? []) as TimelineYearGroup[]);

function formatMd(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("zh-CN", { month: "long", day: "numeric" });
}
</script>
