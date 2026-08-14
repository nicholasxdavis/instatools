<script setup>
defineProps({
  count: { type: Number, default: 3 },
  active: { type: Number, default: 0 },
  color: { type: String, default: '#FFFFFF' },
  activeWidth: { type: Number, default: 20 },
  size: { type: Number, default: 8 },
})
</script>

<template>
  <div class="dots">
    <div
      v-for="index in Math.max(1, Math.min(10, count))"
      :key="index"
      class="dot"
      :style="{
        width: `${index - 1 === active ? activeWidth : size}px`,
        height: `${size}px`,
        background: color,
        opacity: index - 1 === active ? 1 : 0.45,
      }"
    />
  </div>
</template>

<style scoped>
.dots {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.dot {
  border-radius: 9999px;
}
</style>
