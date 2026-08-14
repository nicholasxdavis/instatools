<script setup>
import { PhCheckCircle, PhWarningCircle } from '@phosphor-icons/vue/compact'
import { useToast } from '@/composables/useToast'

const { toast } = useToast()
</script>

<template>
  <Teleport to="body">
    <Transition name="toast">
      <div v-if="toast.visible" class="toast" :class="toast.type" role="status" aria-live="polite">
        <PhWarningCircle v-if="toast.type === 'error'" :size="16" weight="fill" class="icon" />
        <PhCheckCircle v-else :size="16" weight="fill" class="icon" />
        <span>{{ toast.message }}</span>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.toast {
  position: fixed;
  top: calc(var(--topbar) + 12px);
  right: 16px;
  z-index: 80;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  max-width: min(340px, calc(100vw - 32px));
  padding: 10px 14px;
  border-radius: 10px;
  background: #fff;
  border: 1px solid #ebebeb;
  color: #1a1a1a;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.35;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}
.icon {
  flex-shrink: 0;
  margin-top: 1px;
  color: #16a34a;
}
.toast.error .icon {
  color: var(--danger);
}
.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.2s var(--ease), transform 0.2s var(--ease);
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (min-width: 900px) {
  .toast {
    right: 20px;
  }
}

@media (max-width: 899px) {
  .toast {
    left: 12px;
    right: 12px;
    max-width: none;
  }
}
</style>
