<template>
  <Teleport to="body">
    <Transition name="page">
      <div
        v-if="open"
        class="fixed inset-0 z-[100] flex items-start justify-center bg-bg/80 px-4 pb-10 pt-[min(20vh,8rem)] backdrop-blur-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="search-title"
        @click.self="close"
      >
        <div
          class="w-full max-w-xl overflow-hidden rounded-[var(--radius-lg)] border border-edge bg-bg/95 shadow-[0_32px_120px_-48px_var(--color-accent-glow)]"
        >
          <div class="border-b border-edge px-4 py-3">
            <p id="search-title" class="text-xs font-semibold uppercase tracking-[0.16em] text-fg-soft">搜索</p>
            <input
              ref="inputRef"
              v-model="q"
              type="search"
              class="mt-2 w-full border-0 bg-transparent text-lg font-semibold text-fg placeholder:text-fg-soft/50 focus:outline-none focus:ring-0"
              placeholder="输入标题或摘要…"
              autocomplete="off"
              @keydown="onKeydown"
            />
          </div>
          <ul v-if="results.length" class="max-h-[min(50vh,420px)] overflow-y-auto py-2">
            <li v-for="(r, i) in results" :key="r.item._path">
              <button
                type="button"
                class="flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors hover:bg-fg/[0.05]"
                :class="i === active ? 'bg-fg/[0.06]' : ''"
                @click="go(r.item._path)"
                @mouseenter="active = i"
              >
                <span class="font-semibold text-fg" v-html="r.titleHtml" />
                <span v-if="r.item.description" class="line-clamp-2 text-sm text-fg-soft" v-html="r.descHtml" />
              </button>
            </li>
          </ul>
          <p v-else class="px-4 py-8 text-center text-sm text-fg-soft">{{ q.trim() ? "没有匹配的文章" : "输入关键词开始搜索" }}</p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import Fuse from "fuse.js";
import type { FuseResultMatch } from "fuse.js";

const open = defineModel<boolean>({ default: false });
type SearchPost = { _path: string; title?: string; description?: string };
const { data: raw } = await useAsyncData(
  "search-writing-index",
  async () => {
    const res = await $fetch<{
      ok: boolean;
      data: {
        items: Array<{ slug: string; title: string; description: string | null }>;
      };
    }>("/api/posts", { query: { status: "published", pageSize: 300 } });
    return res.data.items.map<SearchPost>((p) => ({
      _path: `/writing/${p.slug}`,
      title: p.title,
      description: p.description ?? "",
    }));
  },
  { default: () => [] as SearchPost[] },
);

const inputRef = ref<HTMLInputElement | null>(null);
const q = ref("");
const active = ref(0);

const fuse = computed(() => {
  return new Fuse(raw.value ?? [], {
    keys: [{ name: "title", weight: 0.65 }, { name: "description", weight: 0.35 }],
    threshold: 0.32,
    ignoreLocation: true,
    includeMatches: true,
  });
});

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function highlight(text: string, indices?: FuseResultMatch["indices"]) {
  if (!indices?.length) return escapeHtml(text);
  const sorted = [...indices].sort((a, b) => a[0] - b[0]);
  let res = "";
  let last = 0;
  for (const [start, end] of sorted) {
    res += escapeHtml(text.slice(last, start));
    res += `<mark class="rounded bg-accent/25 px-0.5 text-fg">${escapeHtml(text.slice(start, end + 1))}</mark>`;
    last = end + 1;
  }
  res += escapeHtml(text.slice(last));
  return res;
}

const results = computed(() => {
  const query = q.value.trim();
  if (!query) return [];
  return fuse.value.search(query).slice(0, 12).map((r) => {
    const titleMatch = r.matches?.find((m) => m.key === "title");
    const descMatch = r.matches?.find((m) => m.key === "description");
    const title = String(r.item.title ?? "");
    const desc = String(r.item.description ?? "");
    return {
      item: r.item as { _path: string; title?: string; description?: string },
      titleHtml: titleMatch?.indices ? highlight(title, titleMatch.indices) : escapeHtml(title),
      descHtml: descMatch?.indices ? highlight(desc, descMatch.indices) : escapeHtml(desc),
    };
  });
});

watch(results, () => (active.value = 0));
watch(open, async (v) => { if (v) { await nextTick(); inputRef.value?.focus(); } });

function go(path: string) { navigateTo(path); close(); }
function close() { open.value = false; q.value = ""; }

useEventListener("keydown", (e: KeyboardEvent) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    open.value = true;
  }
});

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Escape") { e.preventDefault(); close(); return; }
  if (e.key === "Enter" && results.value.length) { e.preventDefault(); go(results.value[active.value].item._path); return; }
  if (e.key === "ArrowDown" && results.value.length) { e.preventDefault(); active.value = Math.min(active.value + 1, results.value.length - 1); }
  if (e.key === "ArrowUp" && results.value.length) { e.preventDefault(); active.value = Math.max(active.value - 1, 0); }
}
</script>
