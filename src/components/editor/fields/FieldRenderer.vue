<script setup>
import { computed } from 'vue'
import { PhUploadSimple } from '@phosphor-icons/vue/compact'
import { useEditorStore } from '@/stores/editor'
import { readMediaFile } from '@/utils/media'
import FieldRenderer from './FieldRenderer.vue'

const props = defineProps({
  field: { type: Object, required: true },
})

const store = useEditorStore()
const value = computed(() => store.getValue(props.field.path))
const toggleOn = computed(() => {
  const path = props.field.togglePath
  return path ? !!store.getValue(path) : false
})
const fieldId = computed(() => `field-${props.field.path.replace(/[^a-zA-Z0-9]+/g, '-')}`)
const fillPct = computed(() => {
  const field = props.field
  if (field.type !== 'slider') return 0
  const min = Number(field.min ?? 0)
  const max = Number(field.max ?? 100)
  const current = Number(value.value ?? min)
  if (max === min) return 0
  return Math.min(100, Math.max(0, ((current - min) / (max - min)) * 100))
})

function update(next) {
  const field = props.field
  if (field.type === 'slider') {
    store.setValue(field.path, Number(next))
    return
  }
  if (field.type === 'select' && typeof field.options?.[0]?.value === 'number') {
    store.setValue(field.path, Number(next))
    return
  }
  store.setValue(field.path, next)
}

function flipToggle(path = props.field.path) {
  store.setValue(path, !store.getValue(path))
}

function displayValue() {
  const field = props.field
  if (field.type !== 'slider') return ''
  const current = Number(value.value ?? 0)
  if (field.unit === '%' && field.max <= 1) return `${Math.round(current * 100)}%`
  if (field.unit === '%') return `${Math.round(current)}%`
  if (field.unit === 'px') return `${Math.round(current)}px`
  if (field.unit === 'em') return `${Number(current).toFixed(2)}em`
  return String(current)
}

async function onUpload(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  store.setValue(props.field.path, await readMediaFile(file))
}
</script>

<template>
  <div class="field" :class="`is-${field.type}`">
    <div v-if="field.type === 'toggle'" class="toggle-row">
      <label class="field-label" :for="fieldId">{{ field.label }}</label>
      <button :id="fieldId" class="switch" :class="{ on: !!value }" type="button" :aria-pressed="!!value" :aria-label="field.label" @click="update(!value)">
        <span />
      </button>
    </div>

    <div v-else-if="field.type === 'slider'" class="slider-row">
      <label class="field-label" :for="fieldId">{{ field.label }}</label>
      <input
        type="range"
        :id="fieldId"
        :min="field.min"
        :max="field.max"
        :step="field.step || 1"
        :value="value ?? field.min"
        :aria-label="field.label"
        :aria-valuetext="displayValue()"
        :style="{ '--fill': `${fillPct}%` }"
        @input="update($event.target.value)"
      />
      <span class="slider-value">{{ displayValue() }}</span>
    </div>

    <div v-else-if="field.label" class="label-row">
      <label class="field-label" :for="fieldId">{{ field.label }}</label>
      <button
        v-if="field.togglePath"
        class="switch"
        :class="{ on: toggleOn }"
        type="button"
        :aria-pressed="toggleOn"
        :aria-label="toggleOn ? `Hide ${field.label}` : `Show ${field.label}`"
        :title="toggleOn ? 'Visible' : 'Hidden'"
        @click="flipToggle(field.togglePath)"
      >
        <span />
      </button>
    </div>

    <textarea
      v-if="field.type === 'textarea'"
      :id="fieldId"
      class="control-textarea"
      :rows="field.rows || 4"
      :value="value || ''"
      :placeholder="field.placeholder || ''"
      :aria-label="field.label"
      @input="update($event.target.value)"
    />

    <input
      v-else-if="field.type === 'text'"
      :id="fieldId"
      class="control-input"
      :class="{ dimmed: field.togglePath && !toggleOn }"
      type="text"
      :value="value || ''"
      :placeholder="field.placeholder || ''"
      :aria-label="field.label"
      @input="update($event.target.value)"
    />

    <div v-else-if="field.type === 'color'" class="color-row">
      <div class="color-inputs">
        <input
          class="color-native"
          type="color"
          :value="typeof value === 'string' && value.startsWith('#') && value.length === 7 ? value : '#ffffff'"
          :aria-label="`${field.label} color`"
          @input="update($event.target.value)"
        />
        <input
          :id="fieldId"
          class="control-input"
          type="text"
          :value="value || ''"
          :aria-label="`${field.label} hex`"
          @input="update($event.target.value)"
        />
      </div>
      <div class="swatches">
        <button
          v-for="swatch in field.swatches || []"
          :key="swatch"
          type="button"
          class="swatch"
          :class="{ active: value === swatch }"
          :style="{ background: swatch }"
          :aria-label="`Use ${swatch}`"
          :aria-pressed="value === swatch"
          @click="update(swatch)"
        />
      </div>
    </div>

    <select
      v-else-if="field.type === 'select'"
      :id="fieldId"
      class="control-select"
      :value="value"
      :aria-label="field.label"
      @change="update($event.target.value)"
    >
      <option v-for="option in field.options" :key="option.value" :value="option.value">{{ option.label }}</option>
    </select>

    <div v-else-if="field.type === 'font'" class="stack">
      <select :id="fieldId" class="control-select" :value="value" :aria-label="field.label" @change="update($event.target.value)">
        <option v-for="font in field.fonts" :key="font" :value="font" :style="{ fontFamily: font }">{{ font }}</option>
      </select>
      <input
        v-if="field.customPath"
        class="control-input"
        type="text"
        :value="store.getValue(field.customPath) || ''"
        placeholder="Custom font"
        :aria-label="`${field.label} custom font`"
        @input="store.setValue(field.customPath, $event.target.value)"
      />
    </div>

    <div v-else-if="field.type === 'image'" class="stack">
      <div class="image-row">
        <input
          :id="fieldId"
          class="control-input"
          type="text"
          :value="typeof value === 'string' && value.startsWith('data:') ? '' : (value || '')"
          placeholder="Paste URL or upload"
          :aria-label="field.label"
          @input="update($event.target.value)"
        />
        <label class="icon-btn" :title="`Upload ${field.label}`">
          <input type="file" hidden accept="image/*,video/*" :aria-label="`Upload ${field.label}`" @change="onUpload" />
          <PhUploadSimple :size="15" weight="bold" />
        </label>
      </div>
      <div v-if="field.controls?.length" class="nested">
        <FieldRenderer v-for="control in field.controls" :key="control.path + control.label" :field="control" />
      </div>
    </div>

    <p v-if="field.hint" class="field-hint">{{ field.hint }}</p>
  </div>
</template>

<style scoped>
.field { display: flex; flex-direction: column; gap: 5px; }
.field.is-slider { gap: 0; }
.field.is-toggle { gap: 0; }
.dimmed { opacity: 0.45; }
.label-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.label-row .field-label,
.toggle-row .field-label,
.slider-row .field-label { margin: 0; }
.slider-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 22px;
}
.slider-row .field-label {
  flex: 0 1 7.5em;
}
.slider-row input[type='range'] {
  flex: 1;
  min-width: 0;
  margin: 0;
}
.slider-value {
  flex: 0 0 auto;
  min-width: 3.4em;
  font-size: 12px;
  color: #8a8a8a;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  text-align: right;
}
.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 24px;
}
.field-label {
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.switch {
  width: 32px;
  height: 18px;
  border: 0;
  border-radius: 99px;
  background: #3a3a3a;
  padding: 2px;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.18s ease;
}
.switch span {
  display: block;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #f2f2f2;
  transition: transform 0.18s cubic-bezier(0.22, 1, 0.36, 1);
}
.switch.on { background: #fff; }
.switch.on span {
  transform: translateX(14px);
  background: #1a1a1a;
}
.color-row { display: flex; flex-direction: column; gap: 12px; }
.color-inputs { display: grid; grid-template-columns: 30px 1fr; gap: 6px; }
.color-native {
  width: 30px;
  height: 30px;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: #242424;
  cursor: pointer;
  overflow: hidden;
}
.color-native::-webkit-color-swatch-wrapper { padding: 0; }
.color-native::-webkit-color-swatch {
  border: 0;
  border-radius: 6px;
}
.swatches { display: flex; flex-wrap: wrap; gap: 5px; }
.swatch {
  width: 16px;
  height: 16px;
  border-radius: 99px;
  border: 0;
  cursor: pointer;
}
.swatch.active { box-shadow: 0 0 0 2px #1a1a1a, 0 0 0 3px #fff; }
.stack { display: flex; flex-direction: column; gap: 10px; }
.image-row { display: flex; gap: 6px; }
.nested {
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 8px 0 0;
}
</style>
