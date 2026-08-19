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

    savePreset(name) {
      const preset = {
        id: Date.now(),
        name: name || `Preset ${this.presets.length + 1}`,
        mode: this.mode,
        createdAt: new Date().toISOString(),
        post: clone(this.post),
      }
      this.presets.unshift(preset)
      this.persistPresets()
      return preset
    },

    loadPreset(id) {
      const preset = this.presets.find((item) => item.id === id)
      if (!preset?.post) return false
      const next = clone(preset.post)
      const key = templateStateKey(next.template)
      if (key !== 'style') {
        next[key] = { ...getDefaultThemeSlice(key), ...(next[key] || {}) }
      } else {
        next.style = { ...getDefaultThemeSlice('style'), ...(next.style || {}) }
      }
      this.post = { ...this.post, ...next }
      this.mode = preset.mode === 'highlight' ? 'post' : (preset.mode || 'post')
      this.activeTab = 'editor'
      return true
    },

    deletePreset(id) {
      this.presets = this.presets.filter((item) => item.id !== id)
      this.persistPresets()
    },

    importPresets(raw) {
      let data = raw
      if (typeof raw === 'string') data = JSON.parse(raw)

      let incoming = []
      if (Array.isArray(data)) incoming = data
      else if (data && typeof data === 'object' && Array.isArray(data.presets)) incoming = data.presets
      else throw new Error('Invalid preset file - expected an array or { presets: [...] }.')

      const valid = incoming.filter((preset) => {
        if (!preset || typeof preset !== 'object') return false
        if (preset.id == null) return false
        if (typeof preset.name !== 'string' || !preset.name.trim()) return false
        const hasTopStyle = preset.style && typeof preset.style === 'object'
        const hasPostStyle = preset.post?.style && typeof preset.post.style === 'object'
        const hasThemeSlice = preset.post && (
          preset.post.template || preset.post.t2 || preset.post.t3 || preset.post.t4 ||
          preset.post.t5 || preset.post.t6 || preset.post.t7 || preset.post.t8 ||
          preset.post.t9 || preset.post.t10 || preset.post.t11 || preset.post.t12 ||
          preset.post.t13 || preset.post.t14 || preset.post.t15 || preset.post.t16
        )
        return hasTopStyle || hasPostStyle || hasThemeSlice
      })
      if (!valid.length) throw new Error('No valid presets found - each preset needs id, name, and style data.')

      const existingIds = new Set(this.presets.map((preset) => preset?.id).filter((id) => id != null))
      const existingNames = new Map(
        this.presets.map((preset) => [preset?.name?.toLowerCase(), preset?.id]),
      )
      let skipped = 0
      let updated = 0
      const toAdd = []

      for (const preset of valid) {
        if (existingIds.has(preset.id)) {
          skipped += 1
        } else if (existingNames.has(preset.name.toLowerCase())) {
          const oldId = existingNames.get(preset.name.toLowerCase())
          this.presets = this.presets.filter((item) => item.id !== oldId)
          toAdd.push(preset)
          updated += 1
        } else {
          toAdd.push(preset)
        }
      }

      this.presets = [...this.presets, ...toAdd]
      const storageOk = this.persistPresets()
      return { added: toAdd.length, skipped, updated, storageOk }
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
