<script setup>
import { THEMES, themePath } from '@/themes'
import { useEditorStore } from '@/stores/editor'

const store = useEditorStore()
</script>

<template>
  <nav class="picker" aria-label="Instagram post themes">
    <router-link
      v-for="theme in THEMES"
      :key="theme.id"
      :to="themePath(theme)"
      class="card"
      :class="{ active: store.templateId === theme.id }"
      :aria-current="store.templateId === theme.id ? 'page' : undefined"
    >
      <div class="thumb">
        <img :src="theme.cardImageFallback || theme.previewImage" :alt="`${theme.name} Instagram template preview`" width="216" height="270" loading="lazy" decoding="async" />
      </div>
      <span class="meta">
        <span class="name">{{ theme.name }}</span>
        <span v-if="theme.note" class="note">{{ theme.note }}</span>
      </span>
    </router-link>
  </nav>
</template>

<style scoped>
.picker {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-auto-rows: 1fr;
  align-items: stretch;
  gap: 10px;
  padding: 12px;
}
.card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  height: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  text-align: left;
  color: #8a8a8a;
  text-decoration: none;
}
.thumb {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 5;
  flex: 0 0 auto;
  border-radius: 8px;
  overflow: hidden;
  border: 0;
  background: #242424;
}
.card img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
}
.card .meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 1px;
  min-height: 1.3em;
}
.card .name {
  font-size: 12px;
  font-weight: 600;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.card .note {
  font-size: 12px;
  font-weight: 500;
  color: #7a7a7a;
  line-height: 1.25;
}
.card.active .note { color: #bdbdbd; }
.card:not(.active) .thumb { opacity: 0.7; }
.card.active { color: #fff; }
</style>
