<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  block?: boolean
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  loading?: boolean
}>(), {
  variant: 'primary',
  size: 'md',
  block: false,
  disabled: false,
  type: 'button',
  loading: false,
})

const base =
  'inline-flex items-center justify-center rounded-xl font-semibold transition ' +
  'duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ' +
  'shadow-sm hover:shadow-md active:shadow ' +
  'transform hover:-translate-y-0.5 active:translate-y-0 ' + // efek naik
  'disabled:opacity-50 disabled:pointer-events-none'

const sizes: Record<string, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
}

const variants: Record<string, string> = {
  primary:
    'bg-[#014f01] text-white hover:bg-[#013a01] active:bg-[#012a01] ' +
    'focus:ring-[#014f01]',
  secondary:
    'bg-white text-[#014f01] border border-[#014f01]/30 hover:bg-[#014f01]/10 ' +
    'active:bg-[#014f01]/20 focus:ring-[#014f01]',
  ghost:
    'bg-transparent text-[#014f01] hover:bg-[#014f01]/10 active:bg-[#014f01]/20 ' +
    'focus:ring-[#014f01]',
}

const classes = computed(() => [
  base,
  sizes[props.size],
  variants[props.variant],
  props.block ? 'w-full' : '',
])
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="classes"
  >
    <span
      v-if="loading"
      class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
      aria-hidden="true"
    />
    <slot />
  </button>
</template>

<style scoped>
@reference "@/assets/main.css";
</style>
