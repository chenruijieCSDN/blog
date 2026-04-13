/** Mixed CJK + Latin reading time estimate (minutes, at least 1). */
export function estimateReadingMinutesFromText(text: string): number {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (!trimmed) return 1;
  const cjk = (trimmed.match(/[\u4e00-\u9fff]/g) ?? []).length;
  const nonCjk = trimmed.replace(/[\u4e00-\u9fff]/g, " ");
  const words = nonCjk.split(/\s+/).filter(Boolean).length;
  const minutes = cjk / 420 + words / 200;
  return Math.max(1, Math.round(minutes));
}
