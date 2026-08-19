import { defineStore } from 'pinia'
import {
  POST_WIDTH,
  POST_HEIGHT,
  PRESETS_KEY,
  MOBILE_SPLIT_KEY,
  EDITOR_WIDTH_KEY,
  EDITOR_WIDTH_DEFAULT,
  EDITOR_WIDTH_MIN,
  EDITOR_WIDTH_MAX,
} from '@/config/constants'
import { createDefaultState, getDefaultThemeSlice } from '@/themes/defaults'
import { templateStateKey } from '@/utils/text'
import { clone, getByPath, setByPath, presetsForStorage } from '@/utils/media'
import {
  buildDesignPost,
  mergeDesignPost,
  parseImportedDesign,
  validateDesignPost,
  designExportPayload,
} from '@/utils/design-io'

function loadPresets() {
  try {
    const raw = localStorage.getItem(PRESETS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function loadSplit() {
  try {
    const value = Number(localStorage.getItem(MOBILE_SPLIT_KEY))
    if (!Number.isFinite(value)) return 50
    return Math.min(78, Math.max(22, value))
  } catch {
    return 50
  }
}

function loadEditorWidth() {
  try {
    const value = Number(localStorage.getItem(EDITOR_WIDTH_KEY))
    if (!Number.isFinite(value)) return EDITOR_WIDTH_DEFAULT
    return Math.min(EDITOR_WIDTH_MAX, Math.max(EDITOR_WIDTH_MIN, Math.round(value)))
  } catch {
    return EDITOR_WIDTH_DEFAULT
  }
}

export const useEditorStore = defineStore('editor', {
  state: () => {
    const initial = createDefaultState()
    initial.presets = loadPresets()
    initial.mobileEditorPct = loadSplit()
    initial.editorWidth = loadEditorWidth()
    initial.splitDragging = false
    return initial
  },

  getters: {
    templateId: (state) => state.post.template,
    isSquare: (state) => state.post.template === 'template7',
    canvasSize: (state) => ({
      width: POST_WIDTH,
      height: state.post.template === 'template7' ? POST_WIDTH : POST_HEIGHT,
    }),
    themeSlice: (state) => {
      const key = templateStateKey(state.post.template)
      return key === 'style' ? state.post.style : state.post[key]
    },
  },

  actions: {
    getValue(path) {
      return getByPath(this, path)
    },

    setValue(path, value) {
      setByPath(this, path, value)
    },

    selectTemplate(id) {
      if (this.post.template === id) {
        this.activeTab = 'editor'
        return
      }
      this.post.template = id
      this.activeTab = 'editor'
      this.manualZoom = null
    },

    resetCurrentTheme() {
      const key = templateStateKey(this.post.template)
      const fresh = getDefaultThemeSlice(key)
      if (key === 'style') {
        const defaults = createDefaultState().post
        this.post.headline = defaults.headline
        this.post.caption = defaults.caption
        this.post.bgImage = defaults.bgImage
        this.post.style = fresh
        return
      }
      this.post[key] = fresh
    },

    buildCurrentDesign() {
      const post = buildDesignPost(this.post)
      if (!post) return null
      return {
        mode: this.mode === 'highlight' ? 'post' : (this.mode || 'post'),
        post,
      }
    },

    applyDesign(design) {
      if (!design?.post || !validateDesignPost(design.post)) {
        return false
      }
      this.post = mergeDesignPost(this.post, clone(design.post))
      this.mode = design.mode === 'highlight' ? 'post' : (design.mode || 'post')
      this.activeTab = 'editor'
      this.manualZoom = null
      return true
    },

    savePreset(name) {
      const post = buildDesignPost(this.post)
      if (!post) throw new Error('No template selected.')
      const preset = {
        id: Date.now(),
        name: name || `Preset ${this.presets.length + 1}`,
        mode: this.mode === 'highlight' ? 'post' : (this.mode || 'post'),
        createdAt: new Date().toISOString(),
        post,
      }
      this.presets.unshift(preset)
      this.persistPresets()
      return preset
    },

    loadPreset(id) {
      const preset = this.presets.find((item) => item.id === id)
      if (!preset?.post) return false
      return this.applyDesign({ mode: preset.mode, post: preset.post })
    },

    importDesign(raw) {
      const parsed = parseImportedDesign(raw)
      if (!validateDesignPost(parsed.post)) {
        throw new Error('Invalid design data — missing template fields.')
      }
      const ok = this.applyDesign({ mode: parsed.mode, post: parsed.post })
      if (!ok) throw new Error('Could not apply design to the canvas.')
      return { extras: parsed.extras }
    },

    exportDesignPayload() {
      return designExportPayload(this.mode, this.post)
    },

    deletePreset(id) {
      this.presets = this.presets.filter((item) => item.id !== id)
      this.persistPresets()
    },

    persistPresets() {
      try {
        localStorage.setItem(PRESETS_KEY, JSON.stringify(presetsForStorage(this.presets)))
        return true
      } catch {
        return false
      }
    },

    setMobileEditorPct(pct, persist = true) {
      const next = Math.round(Math.min(78, Math.max(22, Number(pct) || 50)))
      this.mobileEditorPct = next
      if (!persist) return
      try {
        localStorage.setItem(MOBILE_SPLIT_KEY, String(next))
      } catch {
        /* ignore */
      }
    },

    setEditorWidth(px, persist = true) {
      const next = Math.round(Math.min(EDITOR_WIDTH_MAX, Math.max(EDITOR_WIDTH_MIN, Number(px) || EDITOR_WIDTH_DEFAULT)))
      this.editorWidth = next
      if (!persist) return
      try {
        localStorage.setItem(EDITOR_WIDTH_KEY, String(next))
      } catch {
        /* ignore */
      }
    },
  },
})
