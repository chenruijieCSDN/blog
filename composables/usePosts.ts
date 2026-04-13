export type TimelinePost = {
  _path: string;
  title?: string;
  description?: string;
  date: string;
};

export type TimelineYearGroup = {
  year: number;
  posts: TimelinePost[];
};

function toTimelinePost(p: { slug: string; title: string; description: string | null; publishedAt: string | null }): TimelinePost | null {
  if (!p.slug || !p.publishedAt) return null;
  const t = new Date(String(p.publishedAt));
  if (Number.isNaN(t.getTime())) return null;
  return {
    _path: `/writing/${p.slug}`,
    title: p.title,
    description: p.description ?? "",
    date: String(p.publishedAt),
  };
}

/**全部已发布文章，按 date 降序。 */
export async function fetchWritingPostsTimeline() {
  const res = await $fetch<{
    ok: boolean;
    data: {
      items: Array<{
        slug: string;
        title: string;
        description: string | null;
        publishedAt: string | null;
      }>;
    };
  }>("/api/posts", { query: { status: "published", pageSize: 200 } });

  const list = (res.data.items ?? [])
    .map(toTimelinePost)
    .filter((p): p is TimelinePost => p !== null);

  return list;
}

/** 按年份分组（新年份在上），组内按日期降序。无文章的年份不会出现。 */
export function groupPostsByYear(posts: TimelinePost[]): TimelineYearGroup[] {
  const byYear = new Map<number, TimelinePost[]>();

  for (const p of posts) {
    const y = new Date(p.date).getFullYear();
    if (!byYear.has(y)) byYear.set(y, []);
    byYear.get(y)!.push(p);
  }

  const years = [...byYear.keys()].sort((a, b) => b - a);

  return years.map((year) => ({
    year,
    posts: (byYear.get(year) ?? []).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    ),
  }));
}

/** 时间轴页：SSR 友好的聚合数据。 */
export function useTimelineGroups() {
  return useAsyncData(
    "timeline-groups",
    async () => {
      const posts = await fetchWritingPostsTimeline();
      return groupPostsByYear(posts);
    },
    { default: () => [] as TimelineYearGroup[] },
  );
}
