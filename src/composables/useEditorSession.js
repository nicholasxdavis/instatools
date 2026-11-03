import { onBeforeUnmount, onMounted, watch } from 'vue'
import { onBeforeRouteLeave, useRouter } from 'vue-router'
import { useEditorStore } from '@/stores/editor'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import { getTheme, getThemeBySlug, THEMES, themePath } from '@/themes'

const AUTOSAVE_MS = 450

export function useEditorSession() {
  const store = useEditorStore()
  const router = useRouter()
  const { confirm } = useConfirm()
  const { show } = useToast()

  let saveTimer = 0
  let resumeHandled = false
  let allowNextLeave = false

  function scheduleDraftSave() {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = window.setTimeout(() => {
      saveTimer = 0
      store.persistDraft()
    }, AUTOSAVE_MS)
  }

  function flushDraft() {
    if (saveTimer) {
      clearTimeout(saveTimer)
      saveTimer = 0
    }
    store.persistDraft()
  }

  async function confirmLeaveEditor() {
    flushDraft()
    return confirm({
      title: 'Leave the editor?',
      message: 'Your design is saved on this device. Come back anytime and pick up where you left off.',
      confirmLabel: 'Leave',
      cancelLabel: 'Stay',
    })
  }

  async function confirmSwitchTemplate(nextName) {
    flushDraft()
    return confirm({
      title: 'Switch layout?',
      message: nextName
        ? `Switch to ${nextName}? Edits on your current layout stay saved on this device.`
        : 'Switch to another layout? Edits on your current layout stay saved on this device.',
      confirmLabel: 'Switch',
      cancelLabel: 'Cancel',
    })
  }

  function onBeforeUnload(event) {
    if (!store.hasUnsavedWork) return
    flushDraft()
    event.preventDefault()
    event.returnValue = ''
  }

  async function guardExternalLeave(event) {
    if (!store.hasUnsavedWork) {
      flushDraft()
      return
    }
    event.preventDefault()
    const ok = await confirmLeaveEditor()
    if (!ok) return
    allowNextLeave = true
    flushDraft()
    const href = event.currentTarget?.getAttribute?.('href')
    if (href) window.location.href = href
  }

  async function openPricing() {
    flushDraft()
    window.open('/pricing', '_blank', 'noopener,noreferrer')
  }

  onMounted(async () => {
    window.addEventListener('beforeunload', onBeforeUnload)

    if (!resumeHandled && !store.draftRestored) {
      resumeHandled = true
      const restored = store.restoreDraftIfAny()
      if (restored) {
        show('Resumed where you left off')
        const theme = getTheme(store.templateId) || THEMES[0]
        const path = themePath(theme)
        if (router.currentRoute.value.path !== path) {
          allowNextLeave = true
          await router.replace(path)
        }
      }
    }
  })

  onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', onBeforeUnload)
    flushDraft()
  })

  watch(
    () => [store.post, store.mode],
    () => {
      if (store._suppressDirty) return
      store.syncDirtyFromFingerprint()
      scheduleDraftSave()
    },
    { deep: true },
  )

  onBeforeRouteLeave(async (to, from) => {
    if (allowNextLeave) {
      allowNextLeave = false
      flushDraft()
      return true
    }

    const stayingInEditor = to.meta?.shell === 'app'
    if (stayingInEditor) {
      const fromSlug = from.params?.slug
      const toSlug = to.params?.slug
      const fromId = fromSlug ? getThemeBySlug(fromSlug)?.id : store.templateId
      const toTheme = toSlug ? getThemeBySlug(toSlug) : THEMES[0]
      const toId = toTheme?.id
      if (fromId && toId && fromId !== toId && store.hasUnsavedWork) {
        const ok = await confirmSwitchTemplate(toTheme?.name)
        if (!ok) return false
      }
      flushDraft()
      return true
    }

    if (!store.hasUnsavedWork) {
      flushDraft()
      return true
    }

    const ok = await confirmLeaveEditor()
    if (!ok) return false
    flushDraft()
    return true
  })

  return {
    flushDraft,
    openPricing,
    guardExternalLeave,
    confirmLeaveEditor,
    confirmSwitchTemplate,
  }
}
