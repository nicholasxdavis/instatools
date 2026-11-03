<script setup>
import { THEMES, themePath } from '@/themes'
import { useEditorStore } from '@/stores/editor'
import { useAccountPlan } from '@/composables/useAccountPlan'

const store = useEditorStore()
const { isPro, isProTheme } = useAccountPlan()
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
        <span v-if="isProTheme(theme) && !isPro" class="pro-badge">Pro</span>
        <span v-else-if="isProTheme(theme)" class="pro-badge pro-badge-owned">Pro</span>
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
.pro-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 2;
  padding: 3px 7px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #fff;
  background: #e1306c;
}
.pro-badge-owned {
  background: rgba(0, 0, 0, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.18);
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
  font-weight: 500;
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

@media (max-width: 899px) {
  .picker {
    gap: 12px;
    padding: 12px 12px 20px;
  }
  .card .name {
    font-size: 13px;
  }
  .pro-badge {
    top: 10px;
    left: 10px;
    padding: 4px 8px;
    font-size: 11px;
  }
}
</style>
