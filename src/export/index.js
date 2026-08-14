import { useEditorStore } from '@/stores/editor'
import { POST_WIDTH, POST_HEIGHT, HIGHLIGHT_SIZE } from '@/config/constants'
import { exportCanvas as runExport, exportPresets as runExportPresets } from './engine'

function bindExportGlobals(notify) {
  const store = useEditorStore()
  let snapshot
  try {
    snapshot = JSON.parse(JSON.stringify({
      mode: store.mode || 'post',
      isExporting: false,
      post: store.post,
      highlight: store.highlight,
      presets: store.presets,
    }))
  } catch {
    snapshot = {
      mode: store.mode || 'post',
      isExporting: false,
      post: store.post,
      highlight: store.highlight,
      presets: [],
    }
  }
  window.state = snapshot
  window.CONSTANTS = { POST_WIDTH, POST_HEIGHT, HIGHLIGHT_SIZE }
  window.showNotification = (message, type = 'success') => notify(message, type)
}

export async function exportCurrentDesign(notify = console.log) {
  const store = useEditorStore()
  bindExportGlobals(notify)

  try {
    await Promise.race([
      document.fonts.ready,
      new Promise((resolve) => setTimeout(resolve, 4000)),
    ])
  } catch {
    /* ignore */
  }

  try {
    await runExport()
  } catch (error) {
    notify(error?.message || 'Export failed. Try again.', 'error')
    throw error
  } finally {
    store.isExporting = false
  }
}

export function exportSavedPresets(notify = console.log) {
  bindExportGlobals(notify)
  runExportPresets()
}
