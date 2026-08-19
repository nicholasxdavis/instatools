<script setup>
import { PhArrowLeft } from '@phosphor-icons/vue/compact'
import BrandMark from '@/components/brand/BrandMark.vue'
</script>

<template>
  <main class="missing" id="workspace">
    <header class="topbar chrome">
      <BrandMark />
    </header>
    <section class="copy" aria-labelledby="missing-title">
      <p class="code">404</p>
      <h1 id="missing-title">Page not found</h1>
      <p>That link does not match an Instatools page. Open the maker or pick a layout.</p>
      <router-link class="ui-btn ui-btn-primary" to="/">
        <PhArrowLeft :size="15" weight="bold" />
        Try now
      </router-link>
    </section>
  </main>
</template>

<style scoped>
.missing {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--chrome);
  color: #f2f2f2;
}
.topbar {
  height: var(--topbar);
  display: flex;
  align-items: center;
  padding: 0 14px;
}
.copy {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 12px;
  padding: 32px 24px 64px;
  max-width: 520px;
}
.code {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: #8a8a8a;
}
h1 {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.03em;
}
p {
  color: #b3b3b3;
  line-height: 1.5;
}
</style>
