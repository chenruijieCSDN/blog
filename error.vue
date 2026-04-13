<template>
  <div
    class="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-bg px-5 text-fg"
  >
    <div
      class="pointer-events-none absolute inset-0 opacity-40"
      aria-hidden="true"
      :style="{
        background: `radial-gradient(ellipse 80% 60% at 50% 0%, var(--color-accent-glow), transparent 55%), conic-gradient(from 120deg at 50% 50%, rgba(12,14,18,0.95), rgba(107,147,201,0.12), rgba(10,10,10,0.98))`,
      }"
    />
    <div class="relative z-[1] max-w-md animate-fade-up text-center">
      <p class="text-xs font-semibold uppercase tracking-[0.22em] text-fg-soft">
        {{ props.error?.statusCode === 404 ? "404" : "Error" }}
      </p>
      <h1 class="mt-4 text-4xl font-black tracking-tight md:text-5xl">
        {{ props.error?.statusCode === 404 ? "页面走失了" : "出了点问题" }}
      </h1>
      <p class="mt-4 text-sm leading-relaxed text-fg-soft">
        {{
          props.error?.statusCode === 404
            ? "链接可能已过期，或你输入了不存在的路径。"
            : props.error?.message || "请稍后再试。"
        }}
      </p>
      <div class="mt-10 flex flex-wrap justify-center gap-3">
        <NuxtLink
          to="/"
          class="rounded-full border border-edge bg-fg/[0.05] px-6 py-2.5 text-sm font-semibold transition-all hover:border-white/10 hover:bg-fg/[0.08] hover:text-accent"
        >
          返回首页
        </NuxtLink>
        <NuxtLink
          to="/writing"
          class="rounded-full border border-edge px-6 py-2.5 text-sm font-semibold text-fg-soft transition-all hover:text-fg"
        >
          去文章列表
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { NuxtError } from "#app";

const props = defineProps<{
  error: NuxtError;
}>();

useHead(() => ({
  title: props.error?.statusCode === 404 ? "未找到" : "错误",
}));
</script>
