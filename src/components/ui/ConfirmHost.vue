<script setup>
import { nextTick, watch } from 'vue'
import { useConfirm } from '@/composables/useConfirm'

const { dialog, accept, dismiss } = useConfirm()
let previousFocus = null

watch(
  () => dialog.open,
  async (open) => {
    if (open) {
      previousFocus = document.activeElement
      await nextTick()
      document.getElementById('confirm-accept')?.focus()
      return
    }
    if (previousFocus && typeof previousFocus.focus === 'function') {
      previousFocus.focus()
    }
    previousFocus = null
  },
)

function onKey(event) {
  if (event.key === 'Escape') {
    event.preventDefault()
    dismiss()
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="dialog.open"
      class="scrim"
      role="presentation"
      @click.self="dismiss"
      @keydown="onKey"
    >
      <div
        class="sheet"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-copy"
      >
        <h2 id="confirm-title">{{ dialog.title }}</h2>
        <p id="confirm-copy">{{ dialog.message }}</p>
        <div class="actions">
          <button class="ui-btn ui-btn-ghost" type="button" @click="dismiss">
            {{ dialog.cancelLabel }}
          </button>
          <button
            id="confirm-accept"
            class="ui-btn"
            :class="dialog.danger ? 'danger' : 'ui-btn-primary'"
            type="button"
            @click="accept"
          >
            {{ dialog.confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.scrim {
  position: fixed;
  inset: 0;
  z-index: 120;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.55);
}
.sheet {
  width: min(380px, 100%);
  padding: 20px 20px 16px;
  border-radius: 12px;
  background: #1a1a1a;
  color: #f2f2f2;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.4);
}
.sheet h2 {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.02em;
}
.sheet p {
  margin: 0 0 18px;
  font-size: 13px;
  line-height: 1.45;
  color: #b3b3b3;
}
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.sheet :deep(.ui-btn-ghost) {
  background: #242424;
  border-color: transparent;
  color: #f2f2f2;
}
.sheet :deep(.ui-btn-ghost:hover) {
  background: #2e2e2e;
}
.danger {
  background: #e11d48;
  border-color: transparent;
  color: #fff;
}
.danger:hover {
  filter: brightness(1.06);
}
</style>
