import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  telemetry: false,
  /** Avoid Vite failing to resolve virtual `#app-manifest` during `nuxt dev` (Nuxt 3.21+). */
  experimental: {
    appManifest: false,
  },
  devtools: { enabled: false },

  modules: [
    "@nuxt/content",
    "@vueuse/nuxt",
    "@vueuse/motion/nuxt",
    "@nuxtjs/color-mode",
    "@nuxtjs/sitemap",
  ],

  css: ["~/assets/css/main.css"],

  runtimeConfig: {
    adminPassword: process.env.ADMIN_PASSWORD || process.env.NUXT_ADMIN_PASSWORD || "",
    adminSessionSecret:
      process.env.NUXT_ADMIN_SESSION_SECRET ||
      process.env.ADMIN_SESSION_SECRET ||
      "dev-admin-secret-change-me",
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || "http://localhost:3000",
      siteName: process.env.NUXT_PUBLIC_SITE_NAME || "Studio",
      giscusRepo: process.env.NUXT_PUBLIC_GISCUS_REPO || "",
      giscusRepoId: process.env.NUXT_PUBLIC_GISCUS_REPO_ID || "",
      giscusCategory: process.env.NUXT_PUBLIC_GISCUS_CATEGORY || "Announcements",
      giscusCategoryId: process.env.NUXT_PUBLIC_GISCUS_CATEGORY_ID || "",
      giscusMapping: process.env.NUXT_PUBLIC_GISCUS_MAPPING || "pathname",
      giscusThemeDark: process.env.NUXT_PUBLIC_GISCUS_THEME_DARK || "transparent_dark",
      giscusThemeLight: process.env.NUXT_PUBLIC_GISCUS_THEME_LIGHT || "light",
      giscusLang: process.env.NUXT_PUBLIC_GISCUS_LANG || "zh-CN",
    },
  },

  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL || "http://localhost:3000",
    name: process.env.NUXT_PUBLIC_SITE_NAME || "Studio",
  },

  sitemap: {
    strictNuxtContentPaths: true,
  },

  colorMode: {
    classSuffix: "",
    preference: "system",
    fallback: "dark",
    storageKey: "blog-color-mode",
  },

  vite: {
    plugins: [tailwindcss()],
  },

  app: {
    pageTransition: { name: "page", mode: "out-in" },
    layoutTransition: { name: "layout", mode: "out-in" },
    head: {
      htmlAttrs: { lang: "zh-CN" },
      titleTemplate: "%s · Studio",
      meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        {
          name: "description",
          content: "开发者作品与个人写作 — 极简排版",
        },
      ],
      link: [
        { rel: "alternate", type: "application/rss+xml", href: "/rss.xml" },
      ],
    },
  },

  content: {
    markdown: {
      anchorLinks: false,
    },
    highlight: {
      theme: "vesper",
    },
  },

  typescript: {
    strict: true,
  },
});
