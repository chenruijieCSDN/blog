import { toValue, type MaybeRefOrGetter } from "vue";

export function useHeroArt(
  seed: MaybeRefOrGetter<number>,
  cover?: MaybeRefOrGetter<string | null | undefined>,
) {
  const gradientLayers = computed(() => {
    const variant = String(toValue(cover) ?? "").toLowerCase().trim();
    const h = Number(toValue(seed) ?? 0);
    const a1 = (h % 360) * 0.45;
    const a2 = ((h * 5) % 360) * 0.35;

    if (variant === "ember") {
      return `
        radial-gradient(ellipse 90% 70% at 20% 30%, rgba(194, 135, 58, 0.35), transparent 58%),
        radial-gradient(ellipse 70% 55% at 85% 15%, rgba(237, 237, 237, 0.08), transparent 52%),
        conic-gradient(from ${a1}deg at 50% 50%,
          rgba(18, 12, 10, 1),
          rgba(194, 135, 58, 0.18),
          rgba(12, 10, 14, 1),
          rgba(107, 147, 201, 0.08),
          rgba(18, 12, 10, 1)
        )
      `;
    }
    if (variant === "aurora") {
      return `
        radial-gradient(ellipse 85% 65% at 15% 25%, rgba(107, 147, 201, 0.38), transparent 55%),
        radial-gradient(ellipse 75% 60% at 90% 30%, rgba(120, 200, 180, 0.12), transparent 52%),
        conic-gradient(from ${a2}deg at 50% 50%,
          rgba(10, 14, 20, 1),
          rgba(107, 147, 201, 0.2),
          rgba(8, 12, 18, 1),
          rgba(237, 237, 237, 0.05),
          rgba(10, 14, 20, 1)
        )
      `;
    }

    return `
      radial-gradient(ellipse 90% 70% at 12% 35%, rgba(107, 147, 201, 0.35), transparent 58%),
      radial-gradient(ellipse 80% 60% at 92% 22%, rgba(194, 135, 58, 0.12), transparent 55%),
      conic-gradient(from ${a1}deg at 50% 50%,
        rgba(12, 13, 18, 1),
        rgba(107, 147, 201, 0.14),
        rgba(10, 10, 10, 1),
        rgba(237, 237, 237, 0.06),
        rgba(12, 13, 18, 1)
      )
    `;
  });

  const heroMesh = computed(() => {
    const h = Number(toValue(seed) ?? 0);
    const deg = ((h * 2) % 72) + 12;
    return `repeating-linear-gradient(
      ${deg}deg,
      transparent,
      transparent 3px,
      rgba(255,255,255,0.04) 3px,
      rgba(255,255,255,0.04) 4px
    )`;
  });

  return { gradientLayers, heroMesh };
}
