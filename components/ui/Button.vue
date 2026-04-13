<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    :class="
      cn(
        'inline-flex items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-semibold tracking-tight transition-all duration-300',
        'border border-edge bg-fg/[0.04] text-fg shadow-[0_0_0_1px_rgba(255,255,255,0.03)_inset] backdrop-blur-sm',
        'hover:border-white/[0.08] hover:bg-fg/[0.07] hover:text-accent',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
        'disabled:pointer-events-none disabled:opacity-40',
        attrs.class as string | undefined,
      )
    "
  >
    <slot />
  </Primitive>
</template>

<script setup lang="ts">
import { Primitive } from "radix-vue";
import { cn } from "~/utils/cn";

const props = withDefaults(
  defineProps<{
    as?: string;
    asChild?: boolean;
  }>(),
  {
    as: "button",
    asChild: false,
  },
);

const attrs = useAttrs();

const as = computed(() => props.as);
const asChild = computed(() => props.asChild);
</script>
