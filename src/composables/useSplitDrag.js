import { onUnmounted, ref } from 'vue'
import { useEditorStore } from '@/stores/editor'
import { EDITOR_WIDTH_DEFAULT } from '@/config/constants'

export function useSplitDrag(bodyEl) {
  const store = useEditorStore()
  const dragging = ref(false)
  let raf = 0

  function pctFromY(y) {
    const box = bodyEl.value?.getBoundingClientRect()
    if (!box) return store.mobileEditorPct
    return ((box.bottom - y) / box.height) * 100
  }

  function onMove(event) {
    if (!dragging.value) return
    const y = event.clientY
    if (raf) cancelAnimationFrame(raf)
    raf = requestAnimationFrame(() => {
      raf = 0
      store.setMobileEditorPct(pctFromY(y), false)
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
    store.setMobileEditorPct(store.mobileEditorPct, true)
  }

  function start(event) {
    dragging.value = true
    event.currentTarget.setPointerCapture?.(event.pointerId)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', stop)
    window.addEventListener('pointercancel', stop)
    store.setMobileEditorPct(pctFromY(event.clientY), false)
  }

  function reset() {
    store.setMobileEditorPct(50, true)
  }

  onUnmounted(stop)

  return { dragging, start, reset }
}

export function useSidebarDrag(bodyEl) {
  const store = useEditorStore()
  const dragging = ref(false)
  let raf = 0

  function widthFromX(x) {
    const box = bodyEl.value?.getBoundingClientRect()
    if (!box) return store.editorWidth
    return x - box.left
  }

  function onMove(event) {
    if (!dragging.value) return
    const x = event.clientX
    if (raf) cancelAnimationFrame(raf)
    raf = requestAnimationFrame(() => {
      raf = 0
      store.setEditorWidth(widthFromX(x), false)
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
    store.setEditorWidth(store.editorWidth, true)
  }

  function start(event) {
    dragging.value = true
    event.currentTarget.setPointerCapture?.(event.pointerId)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', stop)
    window.addEventListener('pointercancel', stop)
    store.setEditorWidth(widthFromX(event.clientX), false)
  }

  function reset() {
    store.setEditorWidth(EDITOR_WIDTH_DEFAULT, true)
  }

  onUnmounted(stop)

  return { dragging, start, reset }
}
