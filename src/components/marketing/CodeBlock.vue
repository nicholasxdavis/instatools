<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  code: { type: String, required: true },
})

const copied = ref(false)
let timer = 0

const label = computed(() => (copied.value ? 'Copied' : 'Copy'))

async function copy() {
  const text = props.code.replace(/\n$/, '')
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.left = '-9999px'
    document.body.appendChild(area)
    area.select()
    document.execCommand('copy')
    document.body.removeChild(area)
  }
  copied.value = true
  window.clearTimeout(timer)
  timer = window.setTimeout(() => {
    copied.value = false
  }, 1600)
}
</script>

<template>
  <div class="m-code">
    <button class="m-code-copy" type="button" :aria-label="label" @click="copy">{{ label }}</button>
    <pre><code>{{ code }}</code></pre>
  </div>
</template>
