<template>
  <NuxtLink
    :to="to"
    class="inline-flex items-center rounded-full border border-edge bg-fg/[0.03] px-3 py-1 text-xs font-semibold tracking-tight text-fg-soft transition-all duration-300 hover:border-white/10 hover:bg-fg/[0.06] hover:text-accent"
  >
    {{ label }}
  </NuxtLink>
</template>

<script setup lang="ts">
const props = defineProps<{
  tag: string;
  /** `writing` = query on /writing, `page` = /tags/[tag] */
  mode?: "writing" | "page";
}>();

const label = computed(() => props.tag);

const to = computed(() => {
  if (props.mode === "page") {
    return `/tags/${encodeURIComponent(props.tag)}`;
  }
  return { path: "/writing", query: { tag: props.tag } };
});
</script>
