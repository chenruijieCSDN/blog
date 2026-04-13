export function toInt(value: unknown, fallback: number, min: number, max: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

export function safeMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "statusMessage" in err) {
    return String((err as { statusMessage?: string }).statusMessage ?? fallback);
  }
  return fallback;
}
