<template>
  <div class="app" :class="{ 'app-marketing': isMarketing }">
    <a v-if="!isMarketing" class="skip-link" href="#workspace">Skip to editor</a>
    <router-view />
    <ToastHost />
    <ConfirmHost />
  </div>
</template>

<script setup>
import { computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import ToastHost from './components/ui/ToastHost.vue'
import ConfirmHost from './components/ui/ConfirmHost.vue'
import { useSeo } from './composables/useSeo'

useSeo()

const route = useRoute()
const isMarketing = computed(() => route.meta.shell === 'marketing')

function applyShell(shell) {
  const next = shell === 'marketing' ? 'marketing' : 'app'
  document.documentElement.classList.toggle('shell-marketing', next === 'marketing')
  document.documentElement.classList.toggle('shell-app', next === 'app')
}

watch(
  () => route.meta.shell,
  (shell) => applyShell(shell),
  { immediate: true },
)

onMounted(() => {
  document.querySelectorAll('body > noscript').forEach((node) => node.remove())
})
</script>

<style>
.app {
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: var(--chrome);
}
.app-marketing {
  height: auto;
  min-height: 100%;
  overflow: visible;
  background: transparent;
}
</style>
