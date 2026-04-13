<script setup lang="ts">
import { useEventListener } from "@vueuse/core";

if (import.meta.client) {
  useEventListener(
    window,
    "pointermove",
    (e: PointerEvent) => {
      document.documentElement.style.setProperty("--spotlight-x", `${e.clientX}px`);
      document.documentElement.style.setProperty("--spotlight-y", `${e.clientY}px`);
    },
    { passive: true },
  );
}
</script>

<template>
  <span class="sr-only" aria-hidden="true" />
</template>
