<script setup>
import { computed } from 'vue'
import { parseHeadline } from '@/utils/text'

const props = defineProps({
  text: { type: String, default: '' },
  color: { type: String, default: '#FFFFFF' },
  highlight: { type: String, default: '#FF5500' },
  secondary: { type: String, default: '#3B82F6' },
  useBrackets: { type: Boolean, default: true },
  useBraces: { type: Boolean, default: false },
})

const parts = computed(() =>
  parseHeadline(props.text, {
    color: props.color,
    highlight: props.highlight,
    secondary: props.secondary,
    useBrackets: props.useBrackets,
    useBraces: props.useBraces,
  }),
)
</script>

<template>
  <span v-for="(part, index) in parts" :key="index" :style="{ color: part.color }">{{ part.text }}</span>
</template>
