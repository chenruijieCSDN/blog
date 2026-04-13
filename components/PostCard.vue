<template>
  <article class="h-full">
    <NuxtLink
      :to="post._path"
      class="group relative block h-full outline-none focus-visible:ring-2 focus-visible:ring-accent/45 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
    >
      <div
        class="relative flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-edge bg-fg/[0.02] shadow-[0_0_0_1px_rgba(255,255,255,0.03)_inset] transition-all duration-300 ease-out after:pointer-events-none after:absolute after:inset-0 after:opacity-0 after:transition-opacity after:duration-300 after:[background:radial-gradient(120%_80%_at_50%_0%,rgba(107,147,201,0.14),transparent_55%)] group-hover:scale-[1.02] group-hover:shadow-[0_28px_90px_-36px_var(--color-accent-glow),0_24px_64px_-48px_rgba(0,0,0,0.85)] group-hover:after:opacity-100"
      >
        <div class="relative z-[1] flex flex-1 flex-col gap-3 p-6">
          <time
            v-if="post.date"
            :datetime="String(post.date)"
            class="text-xs font-semibold uppercase tracking-[0.14em] text-fg-soft"
          >
            {{ formattedDate }}
          </time>
          <h2
            class="text-xl font-bold tracking-tight text-fg transition-colors duration-300 group-hover:text-accent"
          >
            {{ post.title }}
          </h2>
          <p
            v-if="post.description"
            class="line-clamp-2 text-sm leading-relaxed text-fg-soft"
          >
            {{ post.description }}
          </p>
          <div v-if="post.tags?.length" class="flex flex-wrap gap-1.5">
            <span
              v-for="t in post.tags.slice(0, 4)"
              :key="t"
              class="rounded-full border border-edge bg-fg/[0.04] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-fg-soft"
            >
              {{ t }}
            </span>
          </div>
          <span
            class="mt-auto pt-1 text-sm font-semibold text-accent/90 transition-opacity group-hover:opacity-100"
          >
            阅读全文 →
          </span>
        </div>
      </div>
    </NuxtLink>
  </article>
</template>

<script setup lang="ts">
const props = defineProps<{
  post: {
    _path: string;
    title?: string;
    description?: string;
    date?: string;
    tags?: string[];
  };
}>();

const formattedDate = computed(() => {
  const d = props.post.date ? new Date(props.post.date) : null;
  if (!d || Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
});
</script>
