<template>
  <header
    class="fixed left-0 right-0 top-0 z-50 flex justify-center px-5 pt-6 md:px-8 lg:px-12"
  >
    <nav
      class="flex items-center gap-1 rounded-full border border-edge bg-bg/55 px-2 py-1.5 shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset] backdrop-blur-md backdrop-saturate-150"
      aria-label="主导航"
    >
      <NuxtLink
        v-for="link in links"
        :key="link.to"
        :to="link.to"
        class="rounded-full px-4 py-2 text-sm font-semibold tracking-tight text-fg-soft transition-all duration-300 hover:bg-fg/[0.06] hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        active-class="bg-fg/[0.07] text-fg"
      >
        {{ link.label }}
      </NuxtLink>
      <button
        type="button"
        class="rounded-full px-3 py-2 text-sm font-semibold text-fg-soft transition-all duration-300 hover:bg-fg/[0.06] hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        aria-label="搜索"
        @click="searchOpen = true"
      >
        搜索
      </button>
      <NuxtLink
        to="/admin"
        class="rounded-full px-3 py-2 text-sm font-semibold text-fg-soft transition-all duration-300 hover:bg-fg/[0.06] hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        写作
      </NuxtLink>
      <div class="ml-1 pl-1">
        <ThemeToggle />
      </div>
    </nav>
  </header>
</template>

<script setup lang="ts">
const links = [
  { to: "/", label: "首页" },
  { to: "/writing", label: "文章" },
  { to: "/timeline", label: "时间轴" },
];

const { open: searchOpen } = useSearchPalette();
</script>
