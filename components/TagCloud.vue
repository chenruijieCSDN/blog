<template>
  <div v-if="tags.length" class="flex flex-wrap gap-2">
    <TagLink
      v-for="t in tags"
      :key="t"
      :tag="t"
      :mode="mode"
    />
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    tags: string[];
    mode?: "writing" | "page";
  }>(),
  { mode: "page" },
);

const tags = computed(() =>
  [...new Set(props.tags.map((x) => String(x).trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "zh-CN"),
  ),
);
</script>
