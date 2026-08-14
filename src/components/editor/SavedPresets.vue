<script setup>
import { ref } from 'vue'
import { PhFloppyDisk, PhFolder, PhFolderOpen, PhTrash } from '@phosphor-icons/vue/compact'
import { getTheme } from '@/themes'
import { useEditorStore } from '@/stores/editor'
import { exportSavedPresets } from '@/export'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'

const store = useEditorStore()
const { show } = useToast()
const { confirm } = useConfirm()
const name = ref('')
const importInput = ref(null)

function save() {
  const preset = store.savePreset(name.value.trim())
  name.value = ''
  show(`Saved “${preset.name}”`)
}

async function load(id) {
  const preset = store.presets.find((item) => item.id === id)
  const ok = await confirm({
    title: 'Load this design?',
    message: preset?.name
      ? `“${preset.name}” will replace what’s on the canvas. Unsaved edits are lost.`
      : 'This will replace what’s on the canvas. Unsaved edits are lost.',
    confirmLabel: 'Load',
  })
  if (!ok) return
  if (store.loadPreset(id)) show('Loaded design')
}

async function remove(id) {
  const preset = store.presets.find((item) => item.id === id)
  const ok = await confirm({
    title: 'Delete this save?',
    message: preset?.name
      ? `“${preset.name}” will be removed. This cannot be undone.`
      : 'This save will be removed. This cannot be undone.',
    confirmLabel: 'Delete',
    danger: true,
  })
  if (!ok) return
  store.deletePreset(id)
  show('Deleted')
}

function exportAll() {
  exportSavedPresets((message, type = 'success') => show(message, type))
}

async function importFile(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  try {
    const text = await file.text()
    const result = store.importPresets(text)
    let message = `Imported ${result.added} preset${result.added === 1 ? '' : 's'}!`
    if (result.skipped) message += ` (${result.skipped} duplicate${result.skipped === 1 ? '' : 's'} skipped)`
    if (result.updated) message += ` (${result.updated} updated by name)`
    if (!result.storageOk) message += ' - storage full, export JSON to keep them!'
    show(message, result.storageOk ? 'success' : 'error')
  } catch (error) {
    show(error.message || 'Failed to import presets', 'error')
  }
}

function themeName(preset) {
  return getTheme(preset.post?.template)?.name || 'Theme'
}
</script>

<template>
  <div class="presets">
    <div class="save-row">
      <input v-model="name" class="control-input" type="text" placeholder="Name this design" @keydown.enter="save" />
      <button class="ui-btn ui-btn-primary" type="button" @click="save">
        <PhFloppyDisk :size="15" weight="bold" />
        Save
      </button>
    </div>
    <div class="io-row">
      <button class="ui-btn ui-btn-ghost" type="button" @click="exportAll">
        <PhFolder :size="15" weight="bold" />
        Export All
      </button>
      <button class="ui-btn ui-btn-ghost" type="button" @click="importInput?.click()">
        <PhFolderOpen :size="15" weight="bold" />
        Import
      </button>
      <input ref="importInput" type="file" hidden accept=".json,application/json" @change="importFile" />
    </div>
    <p v-if="!store.presets.length" class="empty">Save a design to reuse it later.</p>
    <div
      v-for="preset in store.presets"
      :key="preset.id"
      class="preset"
      role="button"
      tabindex="0"
      @click="load(preset.id)"
      @keydown.enter="load(preset.id)"
      @keydown.space.prevent="load(preset.id)"
    >
      <div>
        <strong>{{ preset.name }}</strong>
        <span>{{ themeName(preset) }}</span>
      </div>
      <button class="delete" type="button" :aria-label="`Delete ${preset.name}`" title="Delete" @click.stop="remove(preset.id)">
        <PhTrash :size="15" weight="bold" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.presets { display: flex; flex-direction: column; gap: 8px; padding: 12px; }
.save-row { display: flex; gap: 6px; }
.io-row { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.empty { font-size: 12px; color: #7a7a7a; padding: 22px 8px; text-align: center; }
.preset {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 9px 10px;
  border: 0;
  background: #242424;
  border-radius: 8px;
  cursor: pointer;
  color: #f2f2f2;
  transition: background 0.15s ease;
}
.preset:hover { background: #2a2a2a; }
.preset:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
.preset strong { display: block; font-size: 13px; font-weight: 650; }
.preset span { font-size: 12px; color: #8a8a8a; }
.delete {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 0;
  background: transparent;
  color: #999;
  border-radius: 8px;
}
.delete:hover { background: #2a2a2a; color: var(--danger); }
</style>
