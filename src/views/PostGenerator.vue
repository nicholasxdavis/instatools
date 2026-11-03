<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { PhDownloadSimple, PhArrowCounterClockwise, PhHeart, PhLockSimple } from '@phosphor-icons/vue/compact'
import { useEditorStore } from '@/stores/editor'
import { exportCurrentDesign } from '@/export'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { useSidebarDrag, useSplitDrag } from '@/composables/useSplitDrag'
import { useEditorSession } from '@/composables/useEditorSession'
import { useAccountPlan } from '@/composables/useAccountPlan'
import { pageForRoute } from '@/seo/pages'
import { THEMES, getTheme, getThemeBySlug } from '@/themes'
import { publicUrl } from '@/utils/publicUrl'
import BrandMark from '@/components/brand/BrandMark.vue'
import EditorPanel from '@/components/editor/EditorPanel.vue'
import CanvasStage from '@/components/canvas/CanvasStage.vue'

const store = useEditorStore()
const route = useRoute()
const page = computed(() => pageForRoute(route))
const { isPro, canExportTheme, refreshPlan, isProTheme } = useAccountPlan()
const { openPricing, guardExternalLeave, flushDraft } = useEditorSession()

watch(
  () => route.params.slug,
  (slug) => {
    const theme = slug ? getThemeBySlug(slug) : THEMES[0]
    if (theme && store.templateId !== theme.id) store.selectTemplate(theme.id)
  },
  { immediate: true },
)

const currentTheme = computed(() => getTheme(store.templateId))
const exportLocked = computed(() => isProTheme(store.templateId) && !isPro.value)
const { show } = useToast()
const { confirm } = useConfirm()
const exporting = ref(false)
const bodyEl = ref(null)
const splitLive = ref(store.mobileEditorPct)
const { dragging: draggingY, start: startY, reset: resetY } = useSplitDrag(bodyEl, {
  onDrag: (pct) => { splitLive.value = Math.round(pct) },
  onCommit: (pct) => store.setMobileEditorPct(pct, true),
  onReset: (pct) => {
    splitLive.value = pct
    store.setMobileEditorPct(pct, true)
  },
})
watch(() => store.mobileEditorPct, (value) => {
  if (!draggingY.value) splitLive.value = value
})
const { dragging: draggingX, start: startX, reset: resetX } = useSidebarDrag(bodyEl)
const dragging = computed(() => draggingX.value || draggingY.value)

onMounted(() => {
  refreshPlan(true)
  if (document.getElementById('support-toast-script')) return
  const script = document.createElement('script')
  script.id = 'support-toast-script'
  script.src = publicUrl('SupportToast.js')
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
  if (!canExportTheme(store.templateId)) {
    show('This layout needs Pro to export.', 'error')
    return
  }
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
        <nav class="tool-nav hide-sm" aria-label="Site">
          <router-link to="/#templates">Layouts</router-link>
          <a href="/privacy" @click="guardExternalLeave">Privacy</a>
          <a href="/terms" @click="guardExternalLeave">Terms</a>
        </nav>
        <h1 class="sr-only">{{ page.h1 }}</h1>
      </div>
      <div class="actions">
        <router-link class="ui-btn ui-btn-ghost api-link hide-sm" to="/docs">API</router-link>
        <button class="ui-btn ui-btn-ghost hide-label" type="button" title="Reset theme" aria-label="Reset theme" @click="resetTheme">
          <PhArrowCounterClockwise :size="15" weight="bold" />
          <span>Reset</span>
        </button>
        <a
          class="ui-btn ui-btn-ghost show-sm support-btn"
          href="https://buymeacoffee.com/galore"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Support"
          title="Support"
          @click="flushDraft"
        >
          <PhHeart :size="15" weight="fill" />
        </a>
        <button
          v-if="exportLocked"
          class="ui-btn ui-btn-primary export-btn"
          type="button"
          @click="openPricing"
        >
          <PhLockSimple :size="15" weight="bold" />
          <span class="export-label">Pro to export</span>
        </button>
        <button
          v-else
          class="ui-btn ui-btn-primary export-btn"
          type="button"
          :disabled="exporting"
          :aria-busy="exporting"
          @click="exportPost"
        >
          <PhDownloadSimple :size="15" weight="bold" />
          <span class="export-label">{{ exporting ? 'Exporting…' : 'Export' }}</span>
        </button>
      </div>
    </header>

    <div v-if="exportLocked" class="pro-banner chrome" role="status">
      <p>
        <strong>{{ currentTheme.name }}</strong> is a Pro layout. Preview it here, then upgrade to export.
      </p>
      <button class="ui-btn ui-btn-primary" type="button" @click="openPricing">Get Pro</button>
    </div>

    <div ref="bodyEl" class="body" id="workspace">
      <CanvasStage class="canvas-slot" />
      <div
        class="editor-pane"
        :style="{
          '--split': `${splitLive}%`,
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
.tool-nav {
  display: flex;
  align-items: center;
  gap: 2px;
  min-width: 0;
}
.tool-nav a {
  display: inline-flex;
  align-items: center;
  height: 32px;
  padding: 0 10px;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 500;
  color: #f2f2f2;
  white-space: nowrap;
}
.tool-nav a:hover {
  background: #2a2a2a;
}
.api-link {
  border-color: rgba(255, 255, 255, 0.16);
}
.actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
.show-sm { display: none; }
.pro-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  background: #141414;
  flex-shrink: 0;
}
.pro-banner p {
  margin: 0;
  font-size: 13px;
  line-height: 1.4;
  color: #d4d4d4;
  min-width: 0;
}
.pro-banner strong {
  color: #fff;
  font-weight: 500;
}
.pro-banner .ui-btn {
  flex-shrink: 0;
}
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
  .topbar {
    height: 52px;
    padding: 0 10px 0 12px;
    gap: 8px;
  }
  .hide-sm { display: none; }
  .hide-label span { display: none; }
  .hide-label {
    width: 40px;
    height: 40px;
    padding: 0;
  }
  .show-sm { display: inline-flex; }
  .support-btn {
    width: 40px;
    height: 40px;
    padding: 0;
  }
  .export-btn {
    height: 40px;
    padding: 0 14px;
    font-size: 13px;
  }
  .pro-banner {
    flex-wrap: wrap;
    padding: 12px;
    gap: 10px;
  }
  .pro-banner .ui-btn {
    width: 100%;
    height: 40px;
  }
  .editor-pane {
    display: flex;
    flex-direction: column;
    flex: 0 0 auto;
    min-height: 0;
    width: 100%;
    height: var(--split, 48%);
    background: var(--chrome);
    padding-bottom: env(safe-area-inset-bottom);
  }
  .dragging .editor-pane {
    will-change: height;
  }
  .dragging .canvas-slot,
  .dragging .editor-slot {
    pointer-events: none;
  }
  .split-y {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 36px;
    flex-shrink: 0;
    background: var(--chrome);
    cursor: ns-resize;
    touch-action: none;
    -webkit-user-select: none;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
  }
  .bar {
    width: 48px;
    height: 5px;
    border-radius: 99px;
    background: #4a4a4a;
  }
  .split-handle:hover .bar { background: #888; }
  .split-handle:active .bar,
  .dragging .bar {
    background: #fff;
    width: 72px;
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
