<template>
  <div class="mx-auto max-w-6xl px-5 pb-24 pt-28 md:px-8 lg:px-12">
    <div class="space-y-6">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-fg-soft">Admin</p>
          <h1 class="mt-2 text-3xl font-black tracking-tight text-fg">文章管理（MySQL）</h1>
        </div>
        <button
          type="button"
          class="rounded-full border border-edge px-4 py-2 text-sm font-semibold text-fg-soft hover:text-fg"
          @click="newPost"
        >
          新建文章
        </button>
      </div>

      <div class="rounded-[var(--radius-lg)] border border-edge bg-fg/[0.02] p-4">
        <label class="block text-sm font-semibold text-fg-soft">
          管理密码（用于创建/更新/删除）
          <input
            v-model="adminPassword"
            type="password"
            autocomplete="current-password"
            class="mt-2 field"
            placeholder="填写与 .env 中 ADMIN_PASSWORD 一致的值"
          />
        </label>
      </div>

      <div class="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside class="rounded-[var(--radius-lg)] border border-edge bg-fg/[0.02] p-4">
          <div class="mb-3 flex items-center justify-between">
            <p class="text-xs font-semibold uppercase tracking-[0.16em] text-fg-soft">文章列表</p>
            <button
              type="button"
              class="rounded-full border border-edge px-3 py-1 text-xs font-semibold text-fg-soft hover:text-fg"
              :disabled="loadingList"
              @click="refreshPosts"
            >
              刷新
            </button>
          </div>

          <ul class="max-h-[560px] space-y-2 overflow-auto pr-1">
            <li v-for="p in posts" :key="p.slug">
              <button
                type="button"
                class="w-full rounded-lg border border-edge px-3 py-2 text-left transition-all hover:bg-fg/[0.06]"
                :class="selectedSlug === p.slug ? 'bg-fg/[0.08]' : 'bg-transparent'"
                @click="loadPost(p.slug)"
              >
                <p class="truncate text-sm font-semibold text-fg">{{ p.title || p.slug }}</p>
                <p class="mt-1 text-xs text-fg-soft">{{ p.status }} · {{ fmtDate(p.publishedAt) }}</p>
              </button>
            </li>
          </ul>
        </aside>

        <section class="space-y-4 rounded-[var(--radius-lg)] border border-edge bg-fg/[0.02] p-5">
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="rounded-full border border-edge px-4 py-2 text-sm font-semibold hover:text-accent"
              :disabled="saving"
              @click="save"
            >
              {{ saving ? "保存中…" : selectedSlug ? "更新文章" : "创建文章" }}
            </button>
            <button
              type="button"
              class="rounded-full border border-edge px-4 py-2 text-sm font-semibold text-accent hover:text-accent-amber"
              :disabled="saving"
              @click="publishNow"
            >
              {{ saving ? "发布中…" : "发布" }}
            </button>
            <button
              v-if="selectedSlug"
              type="button"
              class="rounded-full border border-edge px-4 py-2 text-sm font-semibold text-accent-amber"
              :disabled="saving"
              @click="removePost"
            >
              删除
            </button>
          </div>

          <p v-if="msg" class="text-sm text-accent">{{ msg }}</p>
          <p v-if="err" class="text-sm text-accent-amber">{{ err }}</p>

          <div class="grid gap-4 md:grid-cols-2">
            <label class="block text-sm font-semibold text-fg-soft">
              标题
              <input v-model="form.title" type="text" class="mt-2 field" />
            </label>
            <label class="block text-sm font-semibold text-fg-soft">
              发布时间 (YYYY-MM-DD) / 留空自动
              <input v-model="form.publishedAt" type="text" class="mt-2 field" />
            </label>
          </div>

          <label class="block text-sm font-semibold text-fg-soft">
            描述
            <input v-model="form.description" type="text" class="mt-2 field" />
          </label>

          <label class="block text-sm font-semibold text-fg-soft">
            标签（逗号分隔）
            <input v-model="form.tagsRaw" type="text" class="mt-2 field" />
          </label>

          <div class="grid gap-4 md:grid-cols-3">
            <label class="block text-sm font-semibold text-fg-soft">
              地点
              <div class="mt-2 flex gap-2">
                <input v-model="form.location" type="text" class="field" placeholder="如：上海" />
                <button
                  type="button"
                  class="shrink-0 rounded-xl border border-edge px-3 text-xs font-semibold text-fg-soft hover:text-fg"
                  :disabled="saving || geoLoading"
                  @click="fillCoordinatesFromLocation"
                >
                  {{ geoLoading ? "定位中…" : "自动填充" }}
                </button>
              </div>
            </label>
            <label class="block text-sm font-semibold text-fg-soft">
              纬度 latitude
              <input v-model="form.latitude" type="text" class="mt-2 field" placeholder="31.2304" />
            </label>
            <label class="block text-sm font-semibold text-fg-soft">
              经度 longitude
              <input v-model="form.longitude" type="text" class="mt-2 field" placeholder="121.4737" />
            </label>
          </div>

          <div class="flex flex-wrap gap-4 text-sm font-semibold text-fg-soft">
            <label class="inline-flex items-center gap-2">
              <input v-model="form.status" type="radio" class="accent-accent" value="draft" />
              草稿
            </label>
            <label class="inline-flex items-center gap-2">
              <input v-model="form.status" type="radio" class="accent-accent" value="published" />
              已发布
            </label>
          </div>

          <label class="block text-sm font-semibold text-fg-soft">
            Markdown 正文（Typora 兼容）
            <textarea
              v-model="form.content"
              spellcheck="false"
              class="admin-editor mt-2 h-[360px] w-full resize-y rounded-xl border border-edge p-4 font-mono text-sm leading-relaxed outline-none focus:ring-2 focus:ring-accent/40"
            />
          </label>

          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-fg-soft">实时预览</p>
            <div
              class="admin-preview writing-body mt-3 rounded-[var(--radius-lg)] border border-edge bg-fg/[0.02] p-6"
              v-html="previewHtml"
            />
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { marked } from "marked";

useHead({ title: "写作" });

type PostMeta = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  status: "draft" | "published";
  publishedAt: string | null;
  tags: Array<{ name: string; slug: string }>;
};

const posts = ref<PostMeta[]>([]);
const selectedSlug = ref("");
const loadingList = ref(false);
const saving = ref(false);
const msg = ref("");
const err = ref("");
const geoLoading = ref(false);

const adminPassword = ref("");

const form = reactive({
  title: "",
  description: "",
  location: "",
  latitude: "",
  longitude: "",
  status: "draft" as "draft" | "published",
  publishedAt: "",
  tagsRaw: "",
  content: "# 标题\n\n正文…\n",
});

const previewHtml = computed(() => marked.parse(form.content) as string);

function resetForm() {
  selectedSlug.value = "";
  form.title = "";
  form.description = "";
  form.location = "";
  form.latitude = "";
  form.longitude = "";
  form.status = "draft";
  form.publishedAt = "";
  form.tagsRaw = "";
  form.content = "# 标题\n\n正文…\n";
}

function fmtDate(value: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("zh-CN");
}

/** $fetch 失败时：error.data 为响应 JSON；hint 在 error.data.data.hint */
function fetchErrorMessage(e: unknown, fallback: string): string {
  if (!e || typeof e !== "object") return fallback;
  const o = e as Record<string, unknown>;
  const body = o.data;
  if (body && typeof body === "object") {
    const b = body as Record<string, unknown>;
    const nested = b.data;
    if (nested && typeof nested === "object") {
      const hint = (nested as Record<string, unknown>).hint;
      if (typeof hint === "string" && hint.trim()) return hint;
    }
    const sm = b.statusMessage;
    if (typeof sm === "string" && sm.trim()) return sm;
  }
  if (typeof o.statusMessage === "string" && o.statusMessage.trim()) return o.statusMessage;
  if (typeof o.message === "string" && o.message.trim()) return o.message;
  return fallback;
}

async function refreshPosts() {
  loadingList.value = true;
  try {
    const res = await $fetch<{
      ok: boolean;
      data: { items: PostMeta[] };
    }>("/api/posts");
    posts.value = res.data.items;
  } finally {
    loadingList.value = false;
  }
}

async function loadPost(slug: string) {
  const res = await $fetch<{
    ok: boolean;
    data: PostMeta & { content: string };
  }>(`/api/posts/${slug}`);

  selectedSlug.value = res.data.slug;
  form.title = res.data.title ?? "";
  form.description = res.data.description ?? "";
  form.location = res.data.location ?? "";
  form.latitude = res.data.latitude === null || res.data.latitude === undefined ? "" : String(res.data.latitude);
  form.longitude =
    res.data.longitude === null || res.data.longitude === undefined ? "" : String(res.data.longitude);
  form.status = res.data.status;
  form.publishedAt = res.data.publishedAt ? String(res.data.publishedAt).slice(0, 10) : "";
  form.tagsRaw = (res.data.tags ?? []).map((t) => t.name).join(", ");
  form.content = res.data.content ?? "";
}

function newPost() {
  resetForm();
  msg.value = "";
  err.value = "";
}

function ensurePassword() {
  if (!adminPassword.value.trim()) {
    throw new Error("请先输入管理密码。");
  }
}

async function save() {
  msg.value = "";
  err.value = "";
  saving.value = true;
  try {
    ensurePassword();
    const tags = form.tagsRaw
      .split(/[,，]/)
      .map((t) => t.trim())
      .filter(Boolean);
    const latitude = form.latitude === "" ? undefined : Number(form.latitude);
    const longitude = form.longitude === "" ? undefined : Number(form.longitude);

    if (selectedSlug.value) {
      await $fetch(`/api/posts/${selectedSlug.value}`, {
        method: "PUT",
        body: {
          password: adminPassword.value,
          title: form.title,
          content: form.content,
          description: form.description || undefined,
          location: form.location || undefined,
          latitude,
          longitude,
          status: form.status,
          publishedAt: form.publishedAt || undefined,
          tags,
        },
      });
      msg.value = "已更新文章。";
    } else {
      const res = await $fetch<{ ok: boolean; data: { slug: string } }>("/api/posts/create", {
        method: "POST",
        body: {
          password: adminPassword.value,
          title: form.title,
          content: form.content,
          description: form.description || undefined,
          location: form.location || undefined,
          latitude,
          longitude,
          status: form.status,
          publishedAt: form.publishedAt || undefined,
          tags,
        },
      });
      selectedSlug.value = res.data.slug;
      msg.value = "已创建文章。";
    }

    await refreshPosts();
    await clearNuxtData();
    await refreshNuxtData();
  } catch (e: unknown) {
    err.value = fetchErrorMessage(e, e instanceof Error ? e.message : "保存失败");
  } finally {
    saving.value = false;
  }
}

async function publishNow() {
  form.status = "published";
  if (!form.publishedAt) {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    form.publishedAt = `${yyyy}-${mm}-${dd}`;
  }
  await save();
}

async function fillCoordinatesFromLocation() {
  const q = form.location.trim();
  if (!q) {
    err.value = "请先输入地点。";
    return;
  }
  err.value = "";
  msg.value = "";
  geoLoading.value = true;
  try {
    const result = await $fetch<Array<{ lat: string; lon: string }>>(
      "https://nominatim.openstreetmap.org/search",
      {
        query: { q, format: "json", limit: 1 },
        headers: { "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.7" },
      },
    );
    const first = result?.[0];
    if (!first) {
      err.value = "未找到该地点，请换一个更具体的名称。";
      return;
    }
    form.latitude = String(Number(first.lat).toFixed(6));
    form.longitude = String(Number(first.lon).toFixed(6));
    msg.value = "已自动填充经纬度。";
  } catch {
    err.value = "自动定位失败，请稍后重试或手动填写。";
  } finally {
    geoLoading.value = false;
  }
}

async function removePost() {
  if (!selectedSlug.value) return;
  err.value = "";
  msg.value = "";
  try {
    ensurePassword();
    if (!window.confirm(`确认删除「${form.title || selectedSlug.value}」吗？`)) return;

    await $fetch(`/api/posts/${selectedSlug.value}`, {
      method: "DELETE",
      body: { password: adminPassword.value },
    });

    msg.value = "已删除文章。";
    resetForm();
    await refreshPosts();
    await clearNuxtData();
    await refreshNuxtData();
  } catch (e: unknown) {
    err.value = fetchErrorMessage(e, e instanceof Error ? e.message : "删除失败");
  }
}

onMounted(refreshPosts);
</script>

<style scoped>
.field {
  width: 100%;
  border-radius: 0.75rem;
  border: 1px solid var(--color-edge);
  background: var(--color-bg);
  color: var(--color-fg);
  padding: 0.625rem 1rem;
  outline: none;
}
.field:focus {
  box-shadow: 0 0 0 2px color-mix(in oklab, var(--color-accent) 40%, transparent);
}

.admin-editor {
  background: var(--app-editor-bg);
  color: var(--app-editor-fg);
}

.admin-editor::placeholder {
  color: var(--app-editor-placeholder);
}
</style>
