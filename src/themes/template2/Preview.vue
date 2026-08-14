<script setup>
import { storeToRefs } from 'pinia'
import { useEditorStore } from '@/stores/editor'
import CoverImage from '../shared/CoverImage.vue'
import WatermarkLayer from '../shared/WatermarkLayer.vue'

const { post } = storeToRefs(useEditorStore())
</script>

<template>
  <div class="t2">
    <div
      class="bar"
      :style="{
        background: post.t2.barColor || '#fff',
        padding: `${post.t2.paddingTop ?? 40}px ${post.t2.paddingH ?? 44}px ${post.t2.paddingBottom ?? 36}px`,
      }"
    >
      <p :style="{
        fontFamily: `${post.t2.customFontFamily || post.t2.fontFamily}, sans-serif`,
        fontSize: `${post.t2.fontSize}px`,
        fontWeight: post.t2.fontWeight,
        color: post.t2.textColor || '#000',
        lineHeight: post.t2.lineHeight ?? 1.22,
        letterSpacing: `${post.t2.letterSpacing ?? -0.01}em`,
      }">{{ post.t2.headline }}</p>
    </div>
    <div class="photo">
      <CoverImage
        :src="post.t2.bgImage"
        :pos-x="post.t2.imagePosX"
        :pos-y="post.t2.imagePosY"
        :scale="post.t2.imageScale"
        alt="Background"
      />
      <WatermarkLayer
        :src="post.t2.watermarkUrl"
        :size="post.t2.watermarkSize"
        :opacity="post.t2.watermarkOpacity"
        :pos-x="post.t2.watermarkPosX"
        :pos-y="post.t2.watermarkPosY"
        :visible="post.t2.showWatermark"
      />
    </div>
  </div>
</template>

<style scoped>
.t2 {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: #fff;
}
.bar { flex-shrink: 0; }
.bar p { margin: 0; }
.photo {
  position: relative;
  flex: 1;
  overflow: hidden;
}
</style>
