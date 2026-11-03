import { onUnmounted, ref } from 'vue'
import { useEditorStore } from '@/stores/editor'
import {
  EDITOR_WIDTH_DEFAULT,
  EDITOR_WIDTH_MIN,
  EDITOR_WIDTH_MAX,
} from '@/config/constants'

function clampPct(pct) {
  return Math.min(80, Math.max(28, Number(pct) || 48))
}

function clampWidth(px) {
  return Math.round(Math.min(EDITOR_WIDTH_MAX, Math.max(EDITOR_WIDTH_MIN, Number(px) || EDITOR_WIDTH_DEFAULT)))
}

export function useSplitDrag(bodyEl, options = {}) {
  const store = useEditorStore()
  const dragging = ref(false)
  let raf = 0
  let lastPct = 50
  let handleEl = null

  function pctFromY(y) {
    const box = bodyEl.value?.getBoundingClientRect()
    if (!box || box.height <= 0) return lastPct
    return clampPct(((box.bottom - y) / box.height) * 100)
  }

  function onMove(event) {
    if (!dragging.value) return
    event.preventDefault()
    const y = event.clientY
    if (raf) cancelAnimationFrame(raf)
    raf = requestAnimationFrame(() => {
      raf = 0
      lastPct = pctFromY(y)
      if (options.onDrag) options.onDrag(lastPct)
      else store.setMobileEditorPct(lastPct, false)
    })
  }

  function stop(event) {
    if (!dragging.value) return
    dragging.value = false
    store.splitDragging = false
    if (raf) {
      cancelAnimationFrame(raf)
      raf = 0
    }
    if (handleEl) {
      handleEl.removeEventListener('pointermove', onMove)
      handleEl.removeEventListener('pointerup', stop)
      handleEl.removeEventListener('pointercancel', stop)
      if (event?.pointerId != null) {
        try { handleEl.releasePointerCapture(event.pointerId) } catch { /* ignore */ }
      }
      handleEl = null
    }
    if (options.onCommit) options.onCommit(lastPct)
    else store.setMobileEditorPct(lastPct, true)
  }

  function start(event) {
    event.preventDefault()
    dragging.value = true
    store.splitDragging = true
    handleEl = event.currentTarget
    lastPct = pctFromY(event.clientY)
    if (options.onDrag) options.onDrag(lastPct)
    else store.setMobileEditorPct(lastPct, false)
    handleEl.setPointerCapture?.(event.pointerId)
    handleEl.addEventListener('pointermove', onMove, { passive: false })
    handleEl.addEventListener('pointerup', stop)
    handleEl.addEventListener('pointercancel', stop)
  }

  function reset() {
    const value = 50
    lastPct = value
    if (options.onReset) options.onReset(value)
    else store.setMobileEditorPct(value, true)
  }

  onUnmounted(stop)

  return { dragging, start, reset }
}

export function useSidebarDrag(bodyEl, options = {}) {
  const store = useEditorStore()
  const dragging = ref(false)
  let raf = 0
  let lastWidth = EDITOR_WIDTH_DEFAULT
  let handleEl = null

  function widthFromX(x) {
    const box = bodyEl.value?.getBoundingClientRect()
    if (!box) return lastWidth
    return clampWidth(x - box.left)
  }

  function onMove(event) {
    if (!dragging.value) return
    event.preventDefault()
    const x = event.clientX
    if (raf) cancelAnimationFrame(raf)
    raf = requestAnimationFrame(() => {
      raf = 0
      lastWidth = widthFromX(x)
      if (options.onDrag) options.onDrag(lastWidth)
      else store.setEditorWidth(lastWidth, false)
    })
  }

  function stop(event) {
    if (!dragging.value) return
    dragging.value = false
    if (raf) {
      cancelAnimationFrame(raf)
      raf = 0
    }
    if (handleEl) {
      handleEl.removeEventListener('pointermove', onMove)
      handleEl.removeEventListener('pointerup', stop)
      handleEl.removeEventListener('pointercancel', stop)
      if (event?.pointerId != null) {
        try { handleEl.releasePointerCapture(event.pointerId) } catch { /* ignore */ }
      }
      handleEl = null
    }
    if (options.onCommit) options.onCommit(lastWidth)
    else store.setEditorWidth(lastWidth, true)
  }

  function start(event) {
    event.preventDefault()
    dragging.value = true
    handleEl = event.currentTarget
    lastWidth = widthFromX(event.clientX)
    if (options.onDrag) options.onDrag(lastWidth)
    else store.setEditorWidth(lastWidth, false)
    handleEl.setPointerCapture?.(event.pointerId)
    handleEl.addEventListener('pointermove', onMove, { passive: false })
    handleEl.addEventListener('pointerup', stop)
    handleEl.addEventListener('pointercancel', stop)
  }

  function reset() {
    if (options.onReset) options.onReset(EDITOR_WIDTH_DEFAULT)
    else store.setEditorWidth(EDITOR_WIDTH_DEFAULT, true)
  }

  onUnmounted(stop)

  return { dragging, start, reset }
}
