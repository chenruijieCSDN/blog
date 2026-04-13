<template>
  <div class="spotlight-root relative min-h-dvh bg-bg text-fg">
    <HoleBackground v-if="!isWritingDetail" />
    <SpotlightPointer v-show="uiRevealed" />
    <div
      class="transition-opacity duration-500 ease-out"
      :class="uiRevealed ? 'opacity-100' : 'pointer-events-none opacity-0 select-none'"
      aria-hidden="true"
    >
      <AppNav />
      <main class="relative z-10 pt-28 pb-20 md:pt-32">
        <slot />
      </main>
    </div>
    <SearchPalette v-show="uiRevealed" v-model="searchOpen" />
    <button
      v-if="showEnterGate"
      type="button"
      class="enter-gate fixed inset-0 z-[100] cursor-pointer border-0 bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-4 focus-visible:ring-offset-bg"
      aria-label="点击进入网站"
      @click="revealUi"
    >
      <span
        class="pointer-events-none absolute bottom-10 left-1/2 -translate-x-1/2 text-xs font-semibold uppercase tracking-[0.2em] text-fg-soft/80"
      >
        点击任意处进入
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
const STORAGE_KEY = "site-ui-revealed";

const { open: searchOpen } = useSearchPalette();
const route = useRoute();
const isWritingDetail = computed(
  () => route.path.startsWith("/writing/") && route.path !== "/writing",
);
const isAdminRoute = computed(() => route.path.startsWith("/admin"));

const uiRevealed = ref(false);
const showEnterGate = computed(() => !uiRevealed.value && !isAdminRoute.value);

onMounted(() => {
  if (isAdminRoute.value) {
    uiRevealed.value = true;
    return;
  }
  if (import.meta.client && sessionStorage.getItem(STORAGE_KEY) === "1") {
    uiRevealed.value = true;
  }
});

watch(isAdminRoute, (admin) => {
  if (admin) uiRevealed.value = true;
});

function revealUi() {
  uiRevealed.value = true;
  if (import.meta.client) sessionStorage.setItem(STORAGE_KEY, "1");
}
</script>
