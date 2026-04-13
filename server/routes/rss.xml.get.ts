import { serverQueryContent } from "#content/server";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const base = String(config.public.siteUrl || "").replace(/\/$/, "");
  const posts = await serverQueryContent(event, "writing")
    .only(["_path", "title", "description", "date", "draft"])
    .sort({ date: -1 })
    .find();

  const items = (
    posts as {
      _path: string;
      title?: string;
      description?: string;
      date?: string;
      draft?: boolean;
    }[]
  )
    .filter((p) => p._path && p.draft !== true)
       .map((p) => {
      const link = `${base}${p._path}`;
      const pub = p.date ? new Date(p.date).toUTCString() : new Date().toUTCString();
      return `
 <item>
      <title>${escapeXml(p.title ?? "")}</title>
      <link>${escapeXml(link)}</link>
      <guid>${escapeXml(link)}</guid>
      <pubDate>${pub}</pubDate>
      <description><![CDATA[${p.description ?? ""}]]></description>
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(config.public.siteName || "Blog")}</title>
    <link>${escapeXml(base)}</link>
    <description>Writing</description>
    ${items}
  </channel>
</rss>`;

  setHeader(event, "content-type", "application/rss+xml; charset=utf-8");
  return xml;
});
