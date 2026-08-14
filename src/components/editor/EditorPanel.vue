<script setup>
import { computed } from 'vue'
import { PhPencilSimple, PhSquaresFour, PhBookmarkSimple } from '@phosphor-icons/vue/compact'
import { getTheme } from '@/themes'
import { useEditorStore } from '@/stores/editor'
import { postHasVideo } from '@/utils/media'
import FieldRenderer from './fields/FieldRenderer.vue'
import ThemePicker from './ThemePicker.vue'
import SavedPresets from './SavedPresets.vue'

const store = useEditorStore()
const theme = computed(() => getTheme(store.templateId))
const hasVideo = computed(() => postHasVideo(store.post))
const videoFields = [
  { type: 'toggle', path: 'post.style.showVideoAudio', label: 'Include audio' },
  { type: 'slider', path: 'post.style.videoVolume', label: 'Volume', min: 0, max: 1, step: 0.05, unit: '%' },
]
const TABS = ['editor', 'templates', 'saved']
const tab = computed({
  get: () => store.activeTab,
  set: (value) => { store.activeTab = value },
})

function onTabKey(event) {
  const index = TABS.indexOf(tab.value)
  if (index < 0) return
  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
    event.preventDefault()
    tab.value = TABS[(index + 1) % TABS.length]
  } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
    event.preventDefault()
    tab.value = TABS[(index - 1 + TABS.length) % TABS.length]
  } else if (event.key === 'Home') {
    event.preventDefault()
    tab.value = TABS[0]
  } else if (event.key === 'End') {
    event.preventDefault()
    tab.value = TABS[TABS.length - 1]
  }
}
</script>

<template>
  <aside class="editor chrome" aria-label="Editor">
    <div class="tabs" role="tablist" aria-label="Editor sections" @keydown="onTabKey">
      <button type="button" role="tab" id="tab-editor" aria-controls="panel-editor" :aria-selected="tab === 'editor'" :tabindex="tab === 'editor' ? 0 : -1" :class="{ active: tab === 'editor' }" @click="tab = 'editor'">
        <PhPencilSimple :size="15" weight="bold" />
        Edit
      </button>
      <button type="button" role="tab" id="tab-templates" aria-controls="panel-templates" :aria-selected="tab === 'templates'" :tabindex="tab === 'templates' ? 0 : -1" :class="{ active: tab === 'templates' }" @click="tab = 'templates'">
        <PhSquaresFour :size="15" weight="bold" />
        Themes
      </button>
      <button type="button" role="tab" id="tab-saved" aria-controls="panel-saved" :aria-selected="tab === 'saved'" :tabindex="tab === 'saved' ? 0 : -1" :class="{ active: tab === 'saved' }" @click="tab = 'saved'">
        <PhBookmarkSimple :size="15" weight="bold" />
        Saved
      </button>
    </div>

    <div v-show="tab === 'editor'" id="panel-editor" class="stack" role="tabpanel" aria-labelledby="tab-editor">
      <section v-for="section in theme.fields" :key="section.title" class="section">
        <h2>{{ section.title }}</h2>
        <FieldRenderer v-for="field in section.fields" :key="field.path + field.label" :field="field" />
      </section>
      <section v-if="hasVideo" class="section">
        <h2>Video export</h2>
        <FieldRenderer v-for="field in videoFields" :key="field.path" :field="field" />
      </section>
    </div>
    <div v-show="tab === 'templates'" id="panel-templates" class="stack" role="tabpanel" aria-labelledby="tab-templates">
      <ThemePicker />
    </div>
    <div v-show="tab === 'saved'" id="panel-saved" class="stack" role="tabpanel" aria-labelledby="tab-saved">
      <SavedPresets />
    </div>
  </aside>
</template>

<style scoped>
.editor {
  width: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  padding: 2px 4px 0;
  flex-shrink: 0;
  border: 0;
  border-bottom: 0;
  box-shadow: none;
  outline: none;
  overflow: hidden;
}
.tabs button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  border: 0;
  outline: none;
  box-shadow: none;
  background: transparent;
  color: #8a8a8a;
  height: 40px;
  font-size: 12.5px;
  font-weight: 600;
  text-decoration: none;
  transition: color 0.15s ease;
}
.tabs button::after,
.tabs button::before,
.tabs button.active::after,
.tabs button.active::before,
.tabs button[aria-selected='true']::after,
.tabs button[aria-selected='true']::before {
  content: none !important;
  display: none !important;
}
.tabs button:hover,
.tabs button:focus,
.tabs button:focus-visible {
  color: #fff;
  outline: none;
  box-shadow: none;
  border: 0;
}
.tabs button.active,
.tabs button[aria-selected='true'] {
  color: #fff;
  border: 0;
  box-shadow: none;
  text-decoration: none;
}
.stack {
  flex: 1;
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  padding: 0 0 20px;
  display: flex;
  flex-direction: column;
  border: 0;
  box-shadow: none;
}
.section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 14px 12px;
  border: 0;
}
.section h2 {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #a3a3a3;
  margin-bottom: 2px;
}

@media (min-width: 900px) {
  .editor {
    width: 100%;
    max-height: none;
    height: 100%;
  }
}

@media (max-width: 899px) {
  .editor { height: 100%; }
  .tabs button { height: 38px; font-size: 12px; }
  .section { padding: 12px 12px 14px; }
}
</style>
