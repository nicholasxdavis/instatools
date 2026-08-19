import { onUnmounted, ref } from 'vue'
import { useEditorStore } from '@/stores/editor'
import {
  EDITOR_WIDTH_DEFAULT,
  EDITOR_WIDTH_MIN,
  EDITOR_WIDTH_MAX,
} from '@/config/constants'

function clampPct(pct) {
  return Math.min(78, Math.max(22, Number(pct) || 50))
}

function clampWidth(px) {
  return Math.round(Math.min(EDITOR_WIDTH_MAX, Math.max(EDITOR_WIDTH_MIN, Number(px) || EDITOR_WIDTH_DEFAULT)))
}

export function useSplitDrag(bodyEl, options = {}) {
  const store = useEditorStore()
  const dragging = ref(false)
  let raf = 0
  let lastPct = 50

  function pctFromY(y) {
    const box = bodyEl.value?.getBoundingClientRect()
    if (!box || box.height <= 0) return lastPct
    return clampPct(((box.bottom - y) / box.height) * 100)
  }

  function onMove(event) {
    if (!dragging.value) return
    const y = event.clientY
    if (raf) cancelAnimationFrame(raf)
    raf = requestAnimationFrame(() => {
      raf = 0
      lastPct = pctFromY(y)
      if (options.onDrag) options.onDrag(lastPct)
      else store.setMobileEditorPct(lastPct, false)
    })
  }

  function stop() {
    if (!dragging.value) return
    dragging.value = false
    store.splitDragging = false
    if (raf) {
      cancelAnimationFrame(raf)
      raf = 0
    }
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', stop)
    window.removeEventListener('pointercancel', stop)
    if (options.onCommit) options.onCommit(lastPct)
    else store.setMobileEditorPct(lastPct, true)
  }

  function start(event) {
    event.preventDefault()
    dragging.value = true
    store.splitDragging = true
    lastPct = pctFromY(event.clientY)
    if (options.onDrag) options.onDrag(lastPct)
    else store.setMobileEditorPct(lastPct, false)
    event.currentTarget.setPointerCapture?.(event.pointerId)
    window.addEventListener('pointermove', onMove, { passive: false })
    window.addEventListener('pointerup', stop)
    window.addEventListener('pointercancel', stop)
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

  function widthFromX(x) {
    const box = bodyEl.value?.getBoundingClientRect()
    if (!box) return lastWidth
    return clampWidth(x - box.left)
  }

  function onMove(event) {
    if (!dragging.value) return
    const x = event.clientX
    if (raf) cancelAnimationFrame(raf)
    raf = requestAnimationFrame(() => {
      raf = 0
      lastWidth = widthFromX(x)
      if (options.onDrag) options.onDrag(lastWidth)
      else store.setEditorWidth(lastWidth, false)
    })
  }

  function stop() {
    if (!dragging.value) return
    dragging.value = false
    if (raf) {
      cancelAnimationFrame(raf)
      raf = 0
    }
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', stop)
    window.removeEventListener('pointercancel', stop)
    if (options.onCommit) options.onCommit(lastWidth)
    else store.setEditorWidth(lastWidth, true)
  }

  function start(event) {
    event.preventDefault()
    dragging.value = true
    lastWidth = widthFromX(event.clientX)
    if (options.onDrag) options.onDrag(lastWidth)
    else store.setEditorWidth(lastWidth, false)
    event.currentTarget.setPointerCapture?.(event.pointerId)
    window.addEventListener('pointermove', onMove, { passive: false })
    window.addEventListener('pointerup', stop)
    window.addEventListener('pointercancel', stop)
  }

  function reset() {
    if (options.onReset) options.onReset(EDITOR_WIDTH_DEFAULT)
    else store.setEditorWidth(EDITOR_WIDTH_DEFAULT, true)
  }

  onUnmounted(stop)

  return { dragging, start, reset }
}
