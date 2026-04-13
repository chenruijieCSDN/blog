<template>
  <section
    v-if="enabled"
    class="mx-auto mt-16 max-w-[65ch] border-t border-edge px-5 pt-12 md:px-8 lg:px-12"
  >
    <h2 class="text-sm font-bold uppercase tracking-[0.18em] text-fg-soft">
      评论
    </h2>
    <div ref="host" class="giscus mt-8 min-h-[120px]" />
  </section>
</template>

<script setup lang="ts">
const props = defineProps<{
  comments?: boolean;
}>();

const config = useRuntimeConfig();
const colorMode = useColorMode();
const host = ref<HTMLElement | null>(null);

const enabled = computed(() => {
  if (!props.comments) return false;
  return Boolean(
    config.public.giscusRepo &&
      config.public.giscusRepoId &&
      config.public.giscusCategoryId,
  );
});

function mountGiscus() {
  if (!host.value || !enabled.value) return;
  host.value.innerHTML = "";
  const theme =
    colorMode.value === "dark"
      ? config.public.giscusThemeDark
      : config.public.giscusThemeLight;
  const s = document.createElement("script");
  s.src = "https://giscus.app/client.js";
  s.async = true;
  s.crossOrigin = "anonymous";
  s.setAttribute("data-repo", config.public.giscusRepo);
  s.setAttribute("data-repo-id", config.public.giscusRepoId);
  s.setAttribute("data-category", config.public.giscusCategory);
  s.setAttribute("data-category-id", config.public.giscusCategoryId);
  s.setAttribute("data-mapping", config.public.giscusMapping);
  s.setAttribute("data-strict", "0");
  s.setAttribute("data-reactions-enabled", "1");
  s.setAttribute("data-emit-metadata", "0");
  s.setAttribute("data-input-position", "top");
  s.setAttribute("data-theme", theme);
  s.setAttribute("data-lang", config.public.giscusLang);
  host.value.appendChild(s);
}

onMounted(mountGiscus);

watch(
  () => colorMode.value,
  () => {
    try {
      const iframe = document.querySelector<HTMLIFrameElement>("iframe.giscus-frame");
      iframe?.contentWindow?.postMessage(
        {
          giscus: {
            setConfig: {
              theme:
                colorMode.value === "dark"
                  ? config.public.giscusThemeDark
                  : config.public.giscusThemeLight,
            },
          },
        },
        "https://giscus.app",
      );
    } catch {
      /* ignore */
    }
  },
);
</script>
