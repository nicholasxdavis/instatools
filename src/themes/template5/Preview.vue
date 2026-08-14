<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useEditorStore } from '@/stores/editor'
import { POST_HEIGHT } from '@/config/constants'
import CoverImage from '../shared/CoverImage.vue'
import HeadlineMarkup from '../shared/HeadlineMarkup.vue'
import WatermarkLayer from '../shared/WatermarkLayer.vue'
import PaginationDots from '../shared/PaginationDots.vue'

const { post } = storeToRefs(useEditorStore())
const t5 = computed(() => post.value.t5)
const imgHeight = computed(() => Math.round((t5.value.imageSplit / 100) * POST_HEIGHT))
</script>

<template>
  <div class="t5">
    <div class="photos" :style="{ height: `${imgHeight}px` }">
      <div class="slot" :style="{ flex: `0 0 ${t5.leftWidth ?? 50}%` }">
        <CoverImage :src="t5.imageLeft" :pos-x="t5.leftPosX" :pos-y="t5.leftPosY" :scale="t5.leftScale" alt="Left image" />
      </div>
      <div
        class="slot"
        :style="t5.imageSeparator ? { borderLeft: `${t5.separatorWidth}px solid ${t5.separatorColor}` } : {}"
      >
        <CoverImage :src="t5.imageRight" :pos-x="t5.rightPosX" :pos-y="t5.rightPosY" :scale="t5.rightScale" alt="Right image" />
      </div>
      <WatermarkLayer
        :src="t5.watermarkUrl"
        :size="t5.watermarkSize"
        :opacity="t5.watermarkOpacity"
        :pos-x="t5.watermarkPosX"
        :pos-y="t5.watermarkPosY"
        :visible="t5.showWatermark !== false"
        :z-index="30"
      />
    </div>

    <div
      class="copy"
      :style="{
        background: t5.bgColor,
        padding: `${t5.paddingV}px ${t5.paddingH}px ${Math.round(t5.paddingV * 0.7)}px`,
      }"
    >
      <p :style="{
        fontFamily: `'${t5.customFontFamily || t5.fontFamily}', sans-serif`,
        fontSize: `${t5.fontSize}px`,
        fontWeight: t5.fontWeight,
        textAlign: t5.textAlign || 'center',
        lineHeight: t5.lineHeight,
        letterSpacing: `${t5.letterSpacing}em`,
      }">
        <HeadlineMarkup :text="t5.headline" :color="t5.headlineColor" :highlight="t5.highlightColor" />
      </p>
      <div class="footer">
        <svg v-if="t5.showArrow" width="50" height="20" viewBox="0 0 50 20" fill="none" style="transform: scaleX(-1); display: block;">
          <line x1="48" y1="10" x2="2" y2="10" :stroke="t5.arrowColor" stroke-width="3" />
          <polyline points="12,2 2,10 12,18" fill="none" :stroke="t5.arrowColor" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" />
        </svg>
        <PaginationDots v-if="t5.showDots" :count="t5.dotCount" :active="t5.activeDot" :color="t5.dotColor" :active-width="18" :size="7" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.t5 { position: absolute; inset: 0; display: flex; flex-direction: column; overflow: hidden; }
.photos { display: flex; flex-direction: row; flex-shrink: 0; overflow: hidden; position: relative; }
.slot { flex: 1; overflow: hidden; position: relative; }
.copy {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}
.copy p {
  margin: 0;
  text-transform: uppercase;
  white-space: pre-wrap;
  word-break: break-word;
  width: 100%;
  text-shadow: 0 4px 25px rgba(0,0,0,1);
}
.footer {
  position: absolute;
  bottom: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
</style>
