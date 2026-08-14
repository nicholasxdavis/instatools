<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useEditorStore } from '@/stores/editor'
import CoverImage from '../shared/CoverImage.vue'
import { TWEET_ICONS } from './icons'
import { publicUrl } from '@/utils/publicUrl'

const { post } = storeToRefs(useEditorStore())
const t7 = computed(() => post.value.t7)
const badgeSrc = publicUrl('ui/x-badge.png')
const iconW = computed(() => Math.round((t7.value.metricsFontSize || 30) * 1.85))
const moreW = computed(() => Math.round((t7.value.usernameFontSize || 36) * 0.72))
const badgeSz = computed(() => Math.max(1, Math.round(t7.value.usernameFontSize * 1.05)))
const sp = computed(() => t7.value.spacingBetweenElements || 20)
const ic = computed(() => t7.value.iconColor || '#8B98A5')
const divider = computed(() => `${t7.value.borderWidth ?? 1}px solid ${t7.value.borderColor || 'rgba(255,255,255,0.12)'}`)
const bandPad = computed(() => Math.max(28, Math.round(sp.value * 1.2)))
const fontStack = computed(() =>
  `'${t7.value.customFontFamily || t7.value.fontFamily}', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`,
)
</script>

<template>
  <div
    class="t7"
    :style="{
      background: t7.bgColor,
      padding: `${t7.paddingV}px ${t7.paddingH}px`,
      fontFamily: fontStack,
    }"
  >
    <div class="header" :style="{ marginBottom: `${Math.round(sp * 0.55)}px` }">
      <div class="avatar" :style="{ width: `${t7.profileImageSize}px`, height: `${t7.profileImageSize}px` }">
        <CoverImage v-if="t7.profileImageUrl" :src="t7.profileImageUrl" alt="Profile" />
        <svg v-else :width="t7.profileImageSize" :height="t7.profileImageSize" viewBox="0 0 100 100">
          <circle cx="50" cy="38" r="22" fill="rgba(255,255,255,0.25)" />
          <ellipse cx="50" cy="85" rx="35" ry="25" fill="rgba(255,255,255,0.25)" />
        </svg>
      </div>
      <div class="meta">
        <div class="name-row">
          <span :style="{ fontSize: `${t7.usernameFontSize}px`, fontWeight: t7.usernameFontWeight, color: t7.usernameColor, letterSpacing: `${t7.usernameLetterSpacing ?? 0}em` }">{{ t7.username }}</span>
          <img v-if="t7.showVerifiedBadge" :src="badgeSrc" alt="verified" :style="{ width: `${badgeSz}px`, height: `${badgeSz}px` }" />
        </div>
        <span class="handle" :style="{ fontSize: `${t7.handleFontSize}px`, color: t7.handleColor }">{{ t7.handle }}</span>
      </div>
      <svg class="more" :width="moreW" :height="moreW" viewBox="0 0 24 24" aria-hidden="true">
        <path :fill="ic" :d="TWEET_ICONS.more" />
      </svg>
    </div>

    <div
      class="tweet"
      :style="{
        fontSize: `${t7.tweetFontSize}px`,
        fontWeight: t7.tweetFontWeight,
        color: t7.textColor,
        lineHeight: t7.lineHeight,
        letterSpacing: `${t7.letterSpacing ?? 0}em`,
        marginBottom: `${sp}px`,
      }"
    >{{ t7.tweetText }}</div>

    <div class="time" :style="{ color: t7.timestampColor, fontSize: `${t7.timestampFontSize}px`, marginBottom: `${sp}px` }">
      <span>{{ t7.timestamp }}</span>
      <span class="dot">·</span>
      <span class="src" :style="{ color: t7.sourceColor }">{{ t7.source }}</span>
    </div>

    <div
      class="metrics"
      :style="{
        padding: `${bandPad}px 0`,
        borderTop: divider,
        fontSize: `${t7.metricsFontSize}px`,
      }"
    >
      <span><strong :style="{ color: t7.textColor }">{{ t7.retweets }}</strong><span :style="{ color: t7.metricsColor }"> Retweets</span></span>
      <span><strong :style="{ color: t7.textColor }">{{ t7.quoteTweets }}</strong><span :style="{ color: t7.metricsColor }"> Quote Tweets</span></span>
      <span><strong :style="{ color: t7.textColor }">{{ t7.likes }}</strong><span :style="{ color: t7.metricsColor }"> Likes</span></span>
    </div>

    <div
      v-if="t7.showEngagementIcons"
      class="actions"
      :style="{ padding: `${bandPad}px 0 0`, borderTop: divider }"
    >
      <svg v-for="name in ['reply', 'retweet', 'like', 'share']" :key="name" :width="iconW" :height="iconW" viewBox="0 0 24 24" aria-hidden="true">
        <path :fill="ic" fill-rule="evenodd" :d="TWEET_ICONS[name]" />
      </svg>
    </div>
  </div>
</template>

<style scoped>
.t7 { position: absolute; inset: 0; display: flex; flex-direction: column; overflow: hidden; }
.header { display: flex; align-items: flex-start; flex-shrink: 0; }
.avatar {
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  margin-right: 20px;
  background: #2D3741;
}
.avatar img,
.avatar video { width: 100%; height: 100%; object-fit: cover; }
.meta { flex: 1; display: flex; flex-direction: column; justify-content: flex-start; min-width: 0; padding-top: 4px; }
.name-row { display: flex; align-items: center; line-height: 1.15; gap: 6px; }
.meta span { line-height: 1.15; }
.handle { margin-top: 2px; line-height: 1.2; }
.more { flex-shrink: 0; margin-top: 6px; }
.tweet { white-space: pre-wrap; word-wrap: break-word; }
.time { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.dot { opacity: 0.9; }
.src { text-decoration: none; }
.metrics { display: flex; align-items: center; gap: 48px; flex-shrink: 0; }
.metrics strong { font-weight: 700; }
.actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  align-items: center;
  justify-items: center;
  flex-shrink: 0;
}
</style>
