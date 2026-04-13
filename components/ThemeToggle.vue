<template>
  <button
    type="button"
    class="flex h-10 w-10 items-center justify-center rounded-full border border-edge bg-fg/[0.03] text-fg transition-all duration-300 hover:bg-fg/[0.07] hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
    :aria-label="colorMode.value === 'dark' ? '切换到浅色' : '切换到深色'"
    @click="toggle"
  >
    <svg
      v-if="colorMode.value === 'dark'"
      class="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
    <svg
      v-else
      class="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  </button>
</template>

<script setup lang="ts">
const colorMode = useColorMode();

function toggle() {
  colorMode.preference = colorMode.value === "dark" ? "light" : "dark";
}
</script>
