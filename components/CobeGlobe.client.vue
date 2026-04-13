<template>
  <div class="relative h-[320px] overflow-hidden rounded-[var(--radius-lg)] border border-edge bg-[#05070b]">
    <canvas ref="canvasRef" class="h-full w-full" />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  markers: Array<{ lat: number; lng: number; size?: number }>;
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
let phi = 0;
let destroy: (() => void) | null = null;

onMounted(() => {
  void (async () => {
    const canvas = canvasRef.value;
    if (!canvas) return;
    const mod = await import(/* @vite-ignore */ "https://esm.sh/cobe");
    const createGlobe = mod.default;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    destroy = createGlobe(canvas, {
      devicePixelRatio: dpr,
      width: 1000 * dpr,
      height: 1000 * dpr,
      phi: 0,
      theta: 0.25,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 2.2,
      baseColor: [0.09, 0.18, 0.28],
      markerColor: [0.42, 0.58, 0.8],
      glowColor: [0.12, 0.22, 0.36],
      markers: props.markers,
      onRender: (state) => {
        state.phi = phi;
        phi += 0.003;
      },
    });
  });
});

onBeforeUnmount(() => destroy?.());
</script>
