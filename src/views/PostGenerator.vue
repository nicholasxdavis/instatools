<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { PhDownloadSimple, PhArrowCounterClockwise, PhHeart } from '@phosphor-icons/vue/compact'
import { useEditorStore } from '@/stores/editor'
import { exportCurrentDesign } from '@/export'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { useSidebarDrag, useSplitDrag } from '@/composables/useSplitDrag'
import { pageForRoute } from '@/seo/pages'
import { THEMES, getThemeBySlug } from '@/themes'
import BrandMark from '@/components/brand/BrandMark.vue'
import EditorPanel from '@/components/editor/EditorPanel.vue'
import CanvasStage from '@/components/canvas/CanvasStage.vue'

const store = useEditorStore()
const route = useRoute()
const page = computed(() => pageForRoute(route))

watch(
  () => route.params.slug,
  (slug) => {
    const theme = slug ? getThemeBySlug(slug) : THEMES[0]
    if (theme && store.templateId !== theme.id) store.selectTemplate(theme.id)
  },
  { immediate: true },
)
const { show } = useToast()
const { confirm } = useConfirm()
const exporting = ref(false)
const bodyEl = ref(null)
const { dragging: draggingY, start: startY, reset: resetY } = useSplitDrag(bodyEl)
const { dragging: draggingX, start: startX, reset: resetX } = useSidebarDrag(bodyEl)
const dragging = computed(() => draggingX.value || draggingY.value)

onMounted(() => {
  if (document.getElementById('support-toast-script')) return
  const script = document.createElement('script')
  script.id = 'support-toast-script'
  script.src = '/SupportToast.js'
  script.defer = true
  document.body.appendChild(script)
})

async function resetTheme() {
  const ok = await confirm({
    title: 'Reset this theme?',
    message: 'Headline, images, and all controls go back to the default for this theme. This cannot be undone.',
    confirmLabel: 'Reset',
    danger: true,
  })
  if (!ok) return
  store.resetCurrentTheme()
  show('Theme reset')
}

async function exportPost() {
  if (exporting.value) return
  exporting.value = true
  store.isExporting = true
  try {
    await exportCurrentDesign((message, type = 'success') => show(message, type))
  } catch (error) {
    show(error?.message || 'Export failed. Try again.', 'error')
  } finally {
    exporting.value = false
    store.isExporting = false
  }
}
</script>

<template>
  <div class="workspace" :class="{ dragging, 'dragging-x': draggingX, 'dragging-y': draggingY }">
    <header class="topbar chrome">
      <div class="left">
        <BrandMark />
        <h1 class="sr-only">{{ page.h1 }}</h1>
      </div>
      <div class="actions">
        <button class="ui-btn ui-btn-ghost hide-label" type="button" title="Reset theme" aria-label="Reset theme" @click="resetTheme">
          <PhArrowCounterClockwise :size="15" weight="bold" />
          <span>Reset</span>
        </button>
        <a
          class="ui-btn ui-btn-primary show-sm"
          href="https://buymeacoffee.com/galore"
          target="_blank"
          rel="noopener noreferrer"
        >
          <PhHeart :size="15" weight="fill" />
          Support
        </a>
        <button class="ui-btn ui-btn-primary" type="button" :disabled="exporting" :aria-busy="exporting" @click="exportPost">
          <PhDownloadSimple :size="15" weight="bold" />
          {{ exporting ? 'Exporting…' : 'Export' }}
        </button>
      </div>
    </header>

    <div ref="bodyEl" class="body" id="workspace">
      <CanvasStage class="canvas-slot" />
      <div
        class="editor-pane"
        :style="{
          '--split': `${store.mobileEditorPct}%`,
          '--sidebar': `${store.editorWidth}px`,
        }"
      >
        <div
          class="split-handle split-y"
          role="separator"
          aria-orientation="horizontal"
          aria-label="Drag to resize editor"
          @pointerdown.prevent="startY"
          @dblclick="resetY"
        >
          <span class="bar" />
        </div>
        <EditorPanel class="editor-slot" />
        <div
          class="split-handle split-x"
          role="separator"
          aria-orientation="vertical"
          aria-label="Drag to resize sidebar"
          @pointerdown.prevent="startX"
          @dblclick="resetX"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.workspace {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: var(--chrome);
}
.workspace.dragging {
  user-select: none;
  touch-action: none;
}
.workspace.dragging-y { cursor: ns-resize; }
.workspace.dragging-x { cursor: col-resize; }
.topbar {
  height: var(--topbar);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 12px 0 14px;
  flex-shrink: 0;
  border: 0;
  box-shadow: none;
}
.left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
.show-sm { display: none; }
.body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--chrome);
}
.canvas-slot { flex: 1; min-height: 0; }
.editor-pane { display: contents; }
.split-handle { display: none; }
.split-x { display: none; }
.editor-slot { min-height: 0; }

@media (max-width: 899px) {
  .topbar { padding: 0 10px 0 12px; }
  .hide-label span { display: none; }
  .hide-label {
    width: 32px;
    padding: 0;
  }
  .show-sm { display: inline-flex; }
  .editor-pane {
    display: flex;
    flex-direction: column;
    flex: 0 0 auto;
    min-height: 0;
    width: 100%;
    height: var(--split, 50%);
    background: var(--chrome);
    padding-bottom: env(safe-area-inset-bottom);
    transition: height 0.22s var(--ease);
  }
  .dragging .editor-pane { transition: none; }
  .split-y {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 22px;
    flex-shrink: 0;
    background: var(--chrome);
    cursor: ns-resize;
    touch-action: none;
  }
  .bar {
    width: 36px;
    height: 3px;
    border-radius: 99px;
    background: #4a4a4a;
    transition: width 0.18s var(--ease), background 0.18s ease;
  }
  .split-handle:hover .bar { background: #888; }
  .split-handle:active .bar,
  .dragging .bar {
    background: #fff;
    width: 64px;
  }
  .editor-slot {
    flex: 1;
    min-height: 0;
    width: 100%;
  }
}

@media (min-width: 900px) {
  .body { flex-direction: row; }
  .editor-pane {
    display: flex;
    flex-direction: row;
    order: -1;
    flex: 0 0 auto;
    width: var(--sidebar, var(--editor));
    height: 100%;
    min-width: 0;
    background: var(--chrome);
  }
  .editor-slot {
    flex: 1;
    width: auto;
    min-width: 0;
  }
  .split-x {
    display: block;
    width: 6px;
    flex-shrink: 0;
    margin-right: -3px;
    cursor: col-resize;
    touch-action: none;
    position: relative;
    z-index: 3;
    background: transparent;
  }
  .split-x:hover,
  .dragging-x .split-x {
    background: rgba(255, 255, 255, 0.08);
  }
}
</style>
