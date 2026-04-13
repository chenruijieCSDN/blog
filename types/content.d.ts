declare module "@nuxt/content/dist/runtime/types" {
  interface ParsedContentMeta {
    tags?: string[];
    cover?: string;
    comments?: boolean;
    draft?: boolean;
    image?: string;
    location?: string;
    latitude?: number;
    longitude?: number;
  }
}
