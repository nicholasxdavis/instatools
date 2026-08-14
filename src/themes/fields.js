import { ALIGN_OPTIONS, COLORS, FONTS, FONT_WEIGHTS, SERIF_FONTS, T2_FONTS } from '@/config/constants'

const color = (path, label) => ({ type: 'color', path, label, swatches: COLORS })
const toggle = (path, label) => ({ type: 'toggle', path, label })
const text = (path, label, extra = {}) => ({ type: 'text', path, label, ...extra })
const area = (path, label, extra = {}) => ({ type: 'textarea', path, label, rows: 4, ...extra })
const slider = (path, label, min, max, extra = {}) => ({ type: 'slider', path, label, min, max, ...extra })
const select = (path, label, options) => ({ type: 'select', path, label, options })
const font = (path, customPath, fonts = FONTS) => ({ type: 'font', path, customPath, label: 'Font', fonts })
const image = (path, label, controls = []) => ({ type: 'image', path, label, controls })

const imagePos = (prefix) => [
  slider(`${prefix}imageScale`, 'Zoom', 100, 250, { unit: '%' }),
  slider(`${prefix}imagePosX`, 'Position X', 0, 100, { unit: '%' }),
  slider(`${prefix}imagePosY`, 'Position Y', 0, 100, { unit: '%' }),
]

const cutoutFades = (prefix) => [
  slider(`post.t12.${prefix}FadeTop`, 'Fade out top', 0, 80, { unit: '%' }),
  slider(`post.t12.${prefix}FadeBottom`, 'Fade out bottom', 0, 80, { unit: '%' }),
  slider(`post.t12.${prefix}FadeLeft`, 'Fade out left', 0, 80, { unit: '%' }),
  slider(`post.t12.${prefix}FadeRight`, 'Fade out right', 0, 80, { unit: '%' }),
]

export const THEME_FIELDS = {
  template1: [
    {
      title: 'Content',
      fields: [
        area('post.headline', 'Headline', { hint: 'Use [brackets] and {braces} for accent colors' }),
        area('post.caption', 'Caption', { rows: 3 }),
        image('post.bgImage', 'Background', [
          slider('post.style.imageScale', 'Zoom', 100, 250, { unit: '%' }),
          slider('post.style.bgOpacity', 'Opacity', 0, 1, { step: 0.05, unit: '%' }),
          slider('post.style.imagePosX', 'Position X', 0, 100, { unit: '%' }),
          slider('post.style.imagePosY', 'Position Y', 0, 100, { unit: '%' }),
          slider('post.style.bgNoise', 'Grain', 0, 1, { step: 0.05 }),
        ]),
      ],
    },
    {
      title: 'Typography',
      fields: [
        font('post.style.fontFamily', 'post.style.customFontFamily'),
        slider('post.style.fontSize', 'Size', 32, 180, { unit: 'px' }),
        slider('post.style.lineHeight', 'Line height', 0.7, 1.6, { step: 0.05 }),
        slider('post.style.letterSpacing', 'Letter spacing', -0.08, 0.12, { step: 0.005, unit: 'em' }),
        color('post.style.primaryColor', 'Primary'),
        color('post.style.highlightColor', 'Highlight [ ]'),
        color('post.style.secondaryColor', 'Secondary { }'),
        toggle('post.style.useBracketColor', 'Color [brackets]'),
        toggle('post.style.useBraceColor', 'Color {braces}'),
      ],
    },
    {
      title: 'Overlay & badges',
      fields: [
        color('post.style.overlayColor', 'Overlay color'),
        slider('post.style.overlayOpacity', 'Overlay opacity', 0, 1, { step: 0.05, unit: '%' }),
        image('post.style.overlayImgUrl', 'Circle overlay', [
          toggle('post.style.showOverlay', 'Show overlay'),
          slider('post.style.overlayImgSize', 'Size', 100, 800, { unit: 'px' }),
          slider('post.style.overlayImgPosX', 'Position X', 0, 100, { unit: '%' }),
          slider('post.style.overlayImgPosY', 'Position Y', 0, 100, { unit: '%' }),
          slider('post.style.overlayBorderWidth', 'Border', 0, 50, { unit: 'px' }),
          color('post.style.overlayBorderColor', 'Border color'),
          toggle('post.style.showOverlayBorder', 'Show border'),
          toggle('post.style.showOverlayGlow', 'Glow'),
          color('post.style.overlayGlowColor', 'Glow color'),
          slider('post.style.overlayGlowSize', 'Glow size', 0.2, 2, { step: 0.05 }),
          slider('post.style.overlayGlowIntensity', 'Glow intensity', 0, 1, { step: 0.05 }),
          slider('post.style.overlayNoise', 'Overlay grain', 0, 1, { step: 0.05 }),
        ]),
        text('post.style.badgeText', 'News badge', { togglePath: 'post.style.showNewsBadge' }),
        text('post.style.sourceText', 'Source', { togglePath: 'post.style.showSource' }),
        text('post.style.swipeText', 'Swipe text', { togglePath: 'post.style.showSwipeBadge' }),
        font('post.style.swipeFontFamily', 'post.style.customSwipeFontFamily', T2_FONTS),
        slider('post.style.swipeFontSize', 'Swipe size', 12, 48, { unit: 'px' }),
        slider('post.style.swipeOpacity', 'Swipe opacity', 0, 1, { step: 0.05, unit: '%' }),
        slider('post.style.swipeLetterSpacing', 'Swipe spacing', 0, 0.4, { step: 0.01, unit: 'em' }),
        toggle('post.style.swipeShowIcon', 'Swipe arrow'),
        slider('post.style.swipeIconSize', 'Arrow size', 12, 48, { unit: 'px' }),
        color('post.style.swipeTextColor', 'Swipe color'),
      ],
    },
    {
      title: 'Logo & watermark',
      fields: [
        image('post.style.logoUrl', 'Logo', [
          toggle('post.style.showLogo', 'Show logo'),
          slider('post.style.logoSize', 'Size', 40, 400, { unit: 'px' }),
          slider('post.style.logoOpacity', 'Opacity', 0, 1, { step: 0.05, unit: '%' }),
        ]),
        image('post.style.watermarkUrl', 'Watermark', [
          toggle('post.style.showWatermark', 'Show watermark'),
          slider('post.style.watermarkSize', 'Size', 40, 600, { unit: 'px' }),
          slider('post.style.watermarkOpacity', 'Opacity', 0, 1, { step: 0.05, unit: '%' }),
          slider('post.style.watermarkPosX', 'Position X', 0, 120, { unit: '%' }),
          slider('post.style.watermarkPosY', 'Position Y', 0, 100, { unit: '%' }),
        ]),
      ],
    },
  ],

  template2: [
    {
      title: 'Content',
      fields: [
        area('post.t2.headline', 'Headline'),
        image('post.t2.bgImage', 'Image', imagePos('post.t2.')),
      ],
    },
    {
      title: 'Typography',
      fields: [
        font('post.t2.fontFamily', 'post.t2.customFontFamily', T2_FONTS),
        slider('post.t2.fontSize', 'Size', 28, 120, { unit: 'px' }),
        select('post.t2.fontWeight', 'Weight', FONT_WEIGHTS),
        slider('post.t2.lineHeight', 'Line height', 1, 1.6, { step: 0.02 }),
        slider('post.t2.letterSpacing', 'Letter spacing', -0.06, 0.08, { step: 0.005, unit: 'em' }),
        color('post.t2.textColor', 'Text color'),
        color('post.t2.barColor', 'Bar color'),
        slider('post.t2.paddingH', 'Padding X', 16, 80, { unit: 'px' }),
        slider('post.t2.paddingTop', 'Padding top', 12, 80, { unit: 'px' }),
        slider('post.t2.paddingBottom', 'Padding bottom', 12, 80, { unit: 'px' }),
      ],
    },
    {
      title: 'Watermark',
      fields: [
        image('post.t2.watermarkUrl', 'Watermark', [
          toggle('post.t2.showWatermark', 'Show watermark'),
          slider('post.t2.watermarkSize', 'Size', 40, 500, { unit: 'px' }),
          slider('post.t2.watermarkOpacity', 'Opacity', 0, 1, { step: 0.05, unit: '%' }),
          slider('post.t2.watermarkPosX', 'Position X', 0, 120, { unit: '%' }),
          slider('post.t2.watermarkPosY', 'Position Y', 0, 100, { unit: '%' }),
        ]),
      ],
    },
  ],

  template3: [
    {
      title: 'Content',
      fields: [
        area('post.t3.headline', 'Headline'),
        image('post.t3.bgImage', 'Image', [
          slider('post.t3.imageSplit', 'Image split', 30, 80, { unit: '%' }),
          ...imagePos('post.t3.'),
        ]),
      ],
    },
    {
      title: 'Typography',
      fields: [
        font('post.t3.fontFamily', 'post.t3.customFontFamily'),
        slider('post.t3.fontSize', 'Size', 36, 160, { unit: 'px' }),
        select('post.t3.fontWeight', 'Weight', FONT_WEIGHTS),
        select('post.t3.fontStyle', 'Style', [
          { label: 'Normal', value: 'normal' },
          { label: 'Italic', value: 'italic' },
        ]),
        color('post.t3.headlineColor', 'Headline color'),
        slider('post.t3.lineHeight', 'Line height', 0.8, 1.6, { step: 0.05 }),
        slider('post.t3.letterSpacing', 'Letter spacing', -0.05, 0.15, { step: 0.005, unit: 'em' }),
      ],
    },
    {
      title: 'Brand & background',
      fields: [
        text('post.t3.brandName', 'Brand name', { togglePath: 'post.t3.showBrand' }),
        text('post.t3.brandLetter', 'Brand letter'),
        toggle('post.t3.showBrandLetter', 'Show letter mark'),
        slider('post.t3.brandSize', 'Brand size', 18, 80, { unit: 'px' }),
        slider('post.t3.brandLetterSpacing', 'Brand spacing', 0, 0.2, { step: 0.01, unit: 'em' }),
        color('post.t3.brandColor', 'Brand color'),
        slider('post.t3.dividerWidth', 'Divider width', 0.5, 8, { step: 0.5, unit: 'px' }),
        slider('post.t3.letterBorderWidth', 'Letter ring', 0.5, 8, { step: 0.5, unit: 'px' }),
        toggle('post.t3.showBgColor', 'Show background color'),
        color('post.t3.bgColor', 'Background'),
        toggle('post.t3.showBottomFade', 'Bottom fade'),
        color('post.t3.bottomFadeColor', 'Fade color'),
        slider('post.t3.bottomFadeHeight', 'Fade height', 10, 100, { unit: '%' }),
        slider('post.t3.bottomFadePosY', 'Fade offset', -80, 80, { unit: 'px' }),
        slider('post.t3.bottomFadeOpacity', 'Fade opacity', 0, 1, { step: 0.05, unit: '%' }),
      ],
    },
  ],

  template4: [
    {
      title: 'Content',
      fields: [
        area('post.t4.headline', 'Headline'),
        image('post.t4.bgImage', 'Background', imagePos('post.t4.')),
      ],
    },
    {
      title: 'Typography',
      fields: [
        font('post.t4.fontFamily', 'post.t4.customFontFamily'),
        slider('post.t4.fontSize', 'Size', 40, 180, { unit: 'px' }),
        select('post.t4.fontWeight', 'Weight', FONT_WEIGHTS),
        color('post.t4.headlineColor', 'Headline color'),
        slider('post.t4.lineHeight', 'Line height', 0.8, 1.4, { step: 0.05 }),
        slider('post.t4.letterSpacing', 'Letter spacing', -0.06, 0.12, { step: 0.005, unit: 'em' }),
      ],
    },
    {
      title: 'Magazine chrome',
      fields: [
        text('post.t4.brandText', 'Brand', { togglePath: 'post.t4.showBrand' }),
        color('post.t4.brandBgColor', 'Brand background'),
        color('post.t4.brandTextColor', 'Brand text'),
        slider('post.t4.brandFontSize', 'Brand size', 18, 72, { unit: 'px' }),
        slider('post.t4.brandLetterSpacing', 'Brand spacing', -0.06, 0.2, { step: 0.005, unit: 'em' }),
        text('post.t4.badgeText', 'Badge', { togglePath: 'post.t4.showBadge' }),
        text('post.t4.swipeText', 'Swipe text', { togglePath: 'post.t4.showSwipe' }),
        slider('post.t4.swipeFontSize', 'Swipe size', 14, 48, { unit: 'px' }),
        slider('post.t4.swipeLetterSpacing', 'Swipe spacing', 0, 0.4, { step: 0.01, unit: 'em' }),
        color('post.t4.swipeColor', 'Swipe color'),
        toggle('post.t4.showDivider', 'Divider'),
        slider('post.t4.dividerWidth', 'Divider width', 0.5, 12, { step: 0.5, unit: 'px' }),
        slider('post.t4.dividerOpacity', 'Divider opacity', 0, 1, { step: 0.05, unit: '%' }),
        color('post.t4.dividerColor', 'Divider color'),
        select('post.t4.textAlign', 'Align', ALIGN_OPTIONS),
        toggle('post.t4.showDots', 'Pagination dots'),
        slider('post.t4.dotCount', 'Dot count', 2, 8, { step: 1 }),
        slider('post.t4.activeDot', 'Active dot', 0, 7, { step: 1 }),
        color('post.t4.dotColor', 'Dot color'),
        color('post.t4.overlayColor', 'Overlay'),
        slider('post.t4.overlayOpacity', 'Overlay opacity', 0, 1, { step: 0.05, unit: '%' }),
        slider('post.t4.gradientStrength', 'Gradient', 20, 100, { unit: '%' }),
      ],
    },
  ],

  template5: [
    {
      title: 'Content',
      fields: [
        area('post.t5.headline', 'Headline', { hint: 'Use [brackets] for accent words' }),
        image('post.t5.imageLeft', 'Left image', [
          slider('post.t5.leftScale', 'Zoom', 100, 250, { unit: '%' }),
          slider('post.t5.leftPosX', 'Position X', 0, 100, { unit: '%' }),
          slider('post.t5.leftPosY', 'Position Y', 0, 100, { unit: '%' }),
        ]),
        image('post.t5.imageRight', 'Right image', [
          slider('post.t5.rightScale', 'Zoom', 100, 250, { unit: '%' }),
          slider('post.t5.rightPosX', 'Position X', 0, 100, { unit: '%' }),
          slider('post.t5.rightPosY', 'Position Y', 0, 100, { unit: '%' }),
        ]),
        slider('post.t5.imageSplit', 'Image height', 30, 80, { unit: '%' }),
        slider('post.t5.leftWidth', 'Left / right split', 25, 75, { unit: '%' }),
        toggle('post.t5.imageSeparator', 'Divider'),
        slider('post.t5.separatorWidth', 'Divider width', 1, 24, { unit: 'px' }),
        color('post.t5.separatorColor', 'Divider color'),
      ],
    },
    {
      title: 'Typography',
      fields: [
        font('post.t5.fontFamily', 'post.t5.customFontFamily'),
        slider('post.t5.fontSize', 'Size', 36, 160, { unit: 'px' }),
        select('post.t5.fontWeight', 'Weight', FONT_WEIGHTS),
        color('post.t5.headlineColor', 'Text color'),
        color('post.t5.highlightColor', 'Highlight'),
        color('post.t5.bgColor', 'Block color'),
        select('post.t5.textAlign', 'Align', ALIGN_OPTIONS),
        slider('post.t5.lineHeight', 'Line height', 0.7, 1.4, { step: 0.05 }),
        slider('post.t5.letterSpacing', 'Letter spacing', -0.06, 0.1, { step: 0.005, unit: 'em' }),
        slider('post.t5.paddingH', 'Padding X', 16, 80, { unit: 'px' }),
        slider('post.t5.paddingV', 'Padding Y', 16, 80, { unit: 'px' }),
      ],
    },
    {
      title: 'Extras',
      fields: [
        toggle('post.t5.showArrow', 'Arrow'),
        color('post.t5.arrowColor', 'Arrow color'),
        toggle('post.t5.showDots', 'Dots'),
        slider('post.t5.dotCount', 'Dot count', 2, 8, { step: 1 }),
        slider('post.t5.activeDot', 'Active dot', 0, 7, { step: 1 }),
        color('post.t5.dotColor', 'Dot color'),
        image('post.t5.watermarkUrl', 'Watermark', [
          toggle('post.t5.showWatermark', 'Show watermark'),
          slider('post.t5.watermarkSize', 'Size', 40, 500, { unit: 'px' }),
          slider('post.t5.watermarkOpacity', 'Opacity', 0, 1, { step: 0.05, unit: '%' }),
          slider('post.t5.watermarkPosX', 'Position X', 0, 120, { unit: '%' }),
          slider('post.t5.watermarkPosY', 'Position Y', 0, 100, { unit: '%' }),
        ]),
      ],
    },
  ],

  template6: sportsFields('post.t6'),
  template8: sportsFields('post.t8'),

  template7: [
    {
      title: 'Tweet',
      fields: [
        image('post.t7.profileImageUrl', 'Profile photo', [
          slider('post.t7.profileImageSize', 'Size', 64, 280, { unit: 'px' }),
        ]),
        text('post.t7.username', 'Username'),
        text('post.t7.handle', 'Handle'),
        area('post.t7.tweetText', 'Tweet'),
        text('post.t7.timestamp', 'Timestamp'),
        text('post.t7.source', 'Source'),
        text('post.t7.retweets', 'Retweets'),
        text('post.t7.quoteTweets', 'Quote tweets'),
        text('post.t7.likes', 'Likes'),
        toggle('post.t7.showVerifiedBadge', 'Verified badge'),
        toggle('post.t7.showEngagementIcons', 'Action icons'),
      ],
    },
    {
      title: 'Theme',
      fields: [
        color('post.t7.bgColor', 'Background'),
        color('post.t7.textColor', 'Text'),
        color('post.t7.usernameColor', 'Username'),
        color('post.t7.handleColor', 'Handle'),
        color('post.t7.timestampColor', 'Timestamp'),
        color('post.t7.sourceColor', 'Source'),
        color('post.t7.metricsColor', 'Metrics'),
        color('post.t7.iconColor', 'Icons'),
        color('post.t7.borderColor', 'Divider color'),
        slider('post.t7.borderWidth', 'Divider width', 0, 8, { step: 0.5, unit: 'px' }),
        color('post.t7.verifiedBadgeColor', 'Badge color'),
        slider('post.t7.tweetFontSize', 'Tweet size', 28, 90, { unit: 'px' }),
        slider('post.t7.usernameFontSize', 'Name size', 18, 56, { unit: 'px' }),
        slider('post.t7.handleFontSize', 'Handle size', 14, 48, { unit: 'px' }),
        slider('post.t7.timestampFontSize', 'Time size', 14, 48, { unit: 'px' }),
        slider('post.t7.metricsFontSize', 'Metrics size', 14, 48, { unit: 'px' }),
        slider('post.t7.letterSpacing', 'Tweet spacing', -0.06, 0.12, { step: 0.005, unit: 'em' }),
        slider('post.t7.usernameLetterSpacing', 'Name spacing', -0.06, 0.12, { step: 0.005, unit: 'em' }),
        slider('post.t7.lineHeight', 'Line height', 1.1, 1.8, { step: 0.02 }),
        slider('post.t7.spacingBetweenElements', 'Spacing', 8, 48, { unit: 'px' }),
        slider('post.t7.paddingH', 'Padding X', 24, 100, { unit: 'px' }),
        slider('post.t7.paddingV', 'Padding Y', 24, 100, { unit: 'px' }),
      ],
    },
  ],

  template9: [
    {
      title: 'Content',
      fields: [
        area('post.t9.headline', 'Headline', { hint: 'Use [brackets] for gold accents' }),
        image('post.t9.bgImage', 'Background', imagePos('post.t9.')),
        image('post.t9.logoUrl', 'Logo', [
          toggle('post.t9.showLogo', 'Show logo'),
          slider('post.t9.logoSize', 'Size', 80, 400, { unit: 'px' }),
          slider('post.t9.logoPosX', 'Position X', 0, 80, { unit: '%' }),
          slider('post.t9.logoPosY', 'Position Y', 0, 80, { unit: '%' }),
        ]),
      ],
    },
    {
      title: 'Typography',
      fields: [
        font('post.t9.fontFamily', 'post.t9.customFontFamily'),
        slider('post.t9.fontSize', 'Size', 48, 180, { unit: 'px' }),
        select('post.t9.fontWeight', 'Weight', FONT_WEIGHTS),
        color('post.t9.headlineColor', 'Text color'),
        color('post.t9.highlightColor', 'Highlight'),
        select('post.t9.textAlign', 'Align', ALIGN_OPTIONS),
        slider('post.t9.lineHeight', 'Line height', 0.8, 1.4, { step: 0.05 }),
        slider('post.t9.letterSpacing', 'Letter spacing', -0.06, 0.12, { step: 0.005, unit: 'em' }),
        slider('post.t9.paddingH', 'Padding X', 16, 100, { unit: 'px' }),
        slider('post.t9.paddingBottom', 'Padding bottom', 24, 160, { unit: 'px' }),
      ],
    },
    {
      title: 'Fade',
      fields: [
        color('post.t9.bottomFadeColor', 'Fade color'),
        slider('post.t9.bottomFadeHeight', 'Height', 10, 80, { unit: '%' }),
        slider('post.t9.bottomFadeOpacity', 'Opacity', 0, 1, { step: 0.05, unit: '%' }),
      ],
    },
  ],

  template10: [
    {
      title: 'Content',
      fields: [
        area('post.t10.headline', 'Headline', { hint: 'Use [brackets] for accent words' }),
        image('post.t10.bgImage', 'Background', [
          slider('post.t10.imageScale', 'Zoom', 100, 250, { unit: '%' }),
          slider('post.t10.imagePosX', 'Position X', 0, 100, { unit: '%' }),
          slider('post.t10.imagePosY', 'Position Y', 0, 100, { unit: '%' }),
        ]),
      ],
    },
    {
      title: 'Typography',
      fields: [
        font('post.t10.fontFamily', 'post.t10.customFontFamily'),
        slider('post.t10.fontSize', 'Size', 60, 220, { unit: 'px' }),
        color('post.t10.headlineColor', 'Text color'),
        color('post.t10.highlightColor', 'Highlight'),
        select('post.t10.textAlign', 'Align', ALIGN_OPTIONS),
        slider('post.t10.lineHeight', 'Line height', 0.7, 1.3, { step: 0.05 }),
        slider('post.t10.letterSpacing', 'Letter spacing', -0.08, 0.2, { step: 0.005, unit: 'em' }),
        slider('post.t10.paddingH', 'Padding X', 24, 140, { unit: 'px' }),
        slider('post.t10.paddingBottom', 'Padding bottom', 24, 160, { unit: 'px' }),
      ],
    },
    {
      title: 'Grunge',
      fields: [
        color('post.t10.overlayColor', 'Overlay'),
        slider('post.t10.overlayOpacity', 'Overlay opacity', 0, 1, { step: 0.05, unit: '%' }),
        slider('post.t10.fadeHeight', 'Fade height', 10, 80, { unit: '%' }),
        slider('post.t10.fadeStrength', 'Fade strength', 0, 1, { step: 0.05 }),
        slider('post.t10.noiseAmount', 'Grain', 0, 1, { step: 0.05 }),
        slider('post.t10.glowHeight', 'Glow height', 10, 90, { unit: '%' }),
        slider('post.t10.glowOpacity', 'Glow opacity', 0, 1, { step: 0.05, unit: '%' }),
        text('post.t10.swipeText', 'Swipe text', { togglePath: 'post.t10.showSwipe' }),
        font('post.t10.swipeFontFamily', 'post.t10.swipeCustomFontFamily'),
        slider('post.t10.swipeFontSize', 'Swipe size', 14, 48, { unit: 'px' }),
        slider('post.t10.swipeLetterSpacing', 'Swipe spacing', 0, 0.5, { step: 0.01, unit: 'em' }),
        color('post.t10.swipeColor', 'Swipe color'),
        select('post.t10.swipeStyle', 'Swipe style', [
          { label: 'Text', value: 'text' },
          { label: 'Chevron', value: 'chevron' },
          { label: 'Badge', value: 'badge' },
        ]),
        image('post.t10.watermarkUrl', 'Watermark', [
          toggle('post.t10.showWatermark', 'Show watermark'),
          slider('post.t10.watermarkSize', 'Size', 40, 600, { unit: 'px' }),
          slider('post.t10.watermarkOpacity', 'Opacity', 0, 1, { step: 0.05, unit: '%' }),
          slider('post.t10.watermarkPosX', 'Position X', 0, 120, { unit: '%' }),
          slider('post.t10.watermarkPosY', 'Position Y', 0, 100, { unit: '%' }),
        ]),
      ],
    },
  ],

  template11: [
    {
      title: 'Content',
      fields: [
        area('post.t11.headline', 'Headline', { hint: 'Line breaks stay. Use [brackets] for accent words.' }),
        image('post.t11.bgImage', 'Background', imagePos('post.t11.')),
      ],
    },
    {
      title: 'Typography',
      fields: [
        font('post.t11.fontFamily', 'post.t11.customFontFamily', SERIF_FONTS),
        slider('post.t11.fontSize', 'Size', 36, 140, { unit: 'px' }),
        select('post.t11.fontWeight', 'Weight', FONT_WEIGHTS),
        toggle('post.t11.fontItalic', 'Italic'),
        color('post.t11.headlineColor', 'Text color'),
        color('post.t11.highlightColor', 'Highlight [ ]'),
        select('post.t11.headlinePos', 'Position', [
          { label: 'Bottom', value: 'bottom' },
          { label: 'Top', value: 'top' },
        ]),
        select('post.t11.textAlign', 'Align', ALIGN_OPTIONS),
        slider('post.t11.lineHeight', 'Line height', 0.85, 1.4, { step: 0.01 }),
        slider('post.t11.letterSpacing', 'Letter spacing', -0.06, 0.08, { step: 0.005, unit: 'em' }),
        slider('post.t11.paddingH', 'Padding X', 24, 160, { unit: 'px' }),
        slider('post.t11.paddingV', 'Padding Y', 24, 180, { unit: 'px' }),
      ],
    },
    {
      title: 'Grade & mark',
      fields: [
        slider('post.t11.fadeHeight', 'Fade height', 0, 80, { unit: '%' }),
        slider('post.t11.fadeStrength', 'Fade strength', 0, 1, { step: 0.02 }),
        color('post.t11.overlayColor', 'Overlay'),
        slider('post.t11.overlayOpacity', 'Overlay opacity', 0, 1, { step: 0.02, unit: '%' }),
        image('post.t11.watermarkUrl', 'Logo', [
          toggle('post.t11.showWatermark', 'Show logo'),
          slider('post.t11.watermarkSize', 'Size', 24, 280, { unit: 'px' }),
          slider('post.t11.watermarkOpacity', 'Opacity', 0, 1, { step: 0.05, unit: '%' }),
          slider('post.t11.watermarkPosX', 'Position X', 0, 120, { unit: '%' }),
          slider('post.t11.watermarkPosY', 'Position Y', 0, 100, { unit: '%' }),
        ]),
      ],
    },
  ],

  template12: [
    {
      title: 'Content',
      fields: [
        area('post.t12.headline', 'Headline', { hint: 'Built for transparent PNG cutouts: rappers, products, people. Line breaks stay.' }),
        text('post.t12.eyebrowLeft', 'Eyebrow left'),
        text('post.t12.eyebrowRight', 'Eyebrow right'),
        text('post.t12.swipeText', 'Swipe text', { togglePath: 'post.t12.showSwipe' }),
        image('post.t12.imageCenter', 'Center cutout', [
          slider('post.t12.centerSize', 'Size', 200, 1100, { unit: 'px' }),
          slider('post.t12.centerPosX', 'Position X', 0, 100, { unit: '%' }),
          slider('post.t12.centerPosY', 'Position Y', 0, 100, { unit: '%' }),
          ...cutoutFades('center'),
        ]),
        image('post.t12.imageLeft', 'Left cutout', [
          slider('post.t12.leftSize', 'Size', 120, 900, { unit: 'px' }),
          slider('post.t12.leftPosX', 'Position X', 0, 100, { unit: '%' }),
          slider('post.t12.leftPosY', 'Position Y', 0, 100, { unit: '%' }),
          ...cutoutFades('left'),
        ]),
        image('post.t12.imageRight', 'Right cutout', [
          slider('post.t12.rightSize', 'Size', 120, 900, { unit: 'px' }),
          slider('post.t12.rightPosX', 'Position X', 0, 100, { unit: '%' }),
          slider('post.t12.rightPosY', 'Position Y', 0, 100, { unit: '%' }),
          ...cutoutFades('right'),
        ]),
      ],
    },
    {
      title: 'Typography',
      fields: [
        font('post.t12.fontFamily', 'post.t12.customFontFamily'),
        slider('post.t12.fontSize', 'Size', 48, 220, { unit: 'px' }),
        select('post.t12.fontWeight', 'Weight', FONT_WEIGHTS),
        color('post.t12.headlineColor', 'Headline'),
        select('post.t12.textAlign', 'Align', ALIGN_OPTIONS),
        slider('post.t12.lineHeight', 'Line height', 0.7, 1.3, { step: 0.01 }),
        slider('post.t12.letterSpacing', 'Letter spacing', -0.08, 0.12, { step: 0.005, unit: 'em' }),
        slider('post.t12.paddingH', 'Padding X', 16, 120, { unit: 'px' }),
        slider('post.t12.paddingBottom', 'Padding bottom', 60, 200, { unit: 'px' }),
        slider('post.t12.eyebrowSize', 'Eyebrow size', 16, 72, { unit: 'px' }),
        color('post.t12.eyebrowColor', 'Eyebrow color'),
        slider('post.t12.eyebrowLetterSpacing', 'Eyebrow spacing', -0.04, 0.2, { step: 0.005, unit: 'em' }),
        slider('post.t12.swipeFontSize', 'Swipe size', 12, 40, { unit: 'px' }),
        color('post.t12.swipeColor', 'Swipe color'),
        slider('post.t12.swipeLetterSpacing', 'Swipe spacing', 0, 0.3, { step: 0.01, unit: 'em' }),
      ],
    },
    {
      title: 'Stage & logo',
      fields: [
        color('post.t12.bgColor', 'Background'),
        color('post.t12.glowColor', 'Glow'),
        slider('post.t12.glowX', 'Glow X', 0, 100, { unit: '%' }),
        slider('post.t12.glowY', 'Glow Y', 0, 100, { unit: '%' }),
        slider('post.t12.glowSize', 'Glow size', 20, 120, { unit: '%' }),
        slider('post.t12.noiseAmount', 'Grain', 0, 1, { step: 0.02 }),
        slider('post.t12.fadeHeight', 'Bottom wash', 0, 80, { unit: '%' }),
        slider('post.t12.fadeStrength', 'Wash strength', 0, 1, { step: 0.02 }),
        image('post.t12.logoUrl', 'Logo', [
          toggle('post.t12.showLogo', 'Show logo'),
          slider('post.t12.logoSize', 'Size', 40, 320, { unit: 'px' }),
          slider('post.t12.logoOpacity', 'Opacity', 0, 1, { step: 0.05, unit: '%' }),
          slider('post.t12.logoPosX', 'Position X', 0, 120, { unit: '%' }),
          slider('post.t12.logoPosY', 'Position Y', 0, 100, { unit: '%' }),
        ]),
      ],
    },
  ],

  template13: [
    {
      title: 'Content',
      fields: [
        area('post.t13.headline', 'Headline', { hint: 'Line breaks stay. Use [brackets] for accent words.' }),
        area('post.t13.dek', 'Dek', { rows: 2, togglePath: 'post.t13.showDek' }),
        text('post.t13.kickerText', 'Kicker', { togglePath: 'post.t13.showKicker' }),
        text('post.t13.metaLeft', 'Meta left'),
        text('post.t13.metaRight', 'Meta right'),
        image('post.t13.bgImage', 'Background', imagePos('post.t13.')),
      ],
    },
    {
      title: 'Typography',
      fields: [
        font('post.t13.fontFamily', 'post.t13.customFontFamily'),
        slider('post.t13.fontSize', 'Size', 64, 220, { unit: 'px' }),
        select('post.t13.fontWeight', 'Weight', FONT_WEIGHTS),
        toggle('post.t13.uppercase', 'Uppercase'),
        color('post.t13.headlineColor', 'Text color'),
        color('post.t13.highlightColor', 'Highlight [ ]'),
        select('post.t13.textAlign', 'Align', ALIGN_OPTIONS),
        slider('post.t13.lineHeight', 'Line height', 0.7, 1.2, { step: 0.01 }),
        slider('post.t13.letterSpacing', 'Letter spacing', -0.04, 0.12, { step: 0.005, unit: 'em' }),
        slider('post.t13.paddingH', 'Padding X', 24, 120, { unit: 'px' }),
        slider('post.t13.paddingBottom', 'Padding bottom', 40, 160, { unit: 'px' }),
        slider('post.t13.dekSize', 'Dek size', 16, 48, { unit: 'px' }),
        select('post.t13.dekWeight', 'Dek weight', FONT_WEIGHTS),
        color('post.t13.dekColor', 'Dek color'),
        slider('post.t13.dekLineHeight', 'Dek line height', 1, 1.6, { step: 0.05 }),
      ],
    },
    {
      title: 'Signal chrome',
      fields: [
        color('post.t13.accentColor', 'Accent'),
        toggle('post.t13.showRail', 'Signal rail'),
        slider('post.t13.railWidth', 'Rail width', 2, 18, { unit: 'px' }),
        slider('post.t13.railInset', 'Rail inset', 8, 56, { unit: 'px' }),
        toggle('post.t13.showPulse', 'Pulse dot'),
        color('post.t13.pulseColor', 'Pulse color'),
        color('post.t13.kickerBg', 'Kicker background'),
        color('post.t13.kickerColor', 'Kicker text'),
        slider('post.t13.kickerSize', 'Kicker size', 14, 36, { unit: 'px' }),
        slider('post.t13.kickerLetterSpacing', 'Kicker spacing', 0, 0.3, { step: 0.01, unit: 'em' }),
        toggle('post.t13.showRule', 'Accent rule'),
        color('post.t13.ruleColor', 'Rule color'),
        slider('post.t13.ruleWidth', 'Rule width', 6, 60, { unit: '%' }),
        slider('post.t13.ruleHeight', 'Rule thickness', 1, 10, { unit: 'px' }),
        toggle('post.t13.showMeta', 'Meta row'),
        slider('post.t13.metaSize', 'Meta size', 12, 32, { unit: 'px' }),
        color('post.t13.metaColor', 'Meta color'),
        slider('post.t13.metaLetterSpacing', 'Meta spacing', 0, 0.3, { step: 0.01, unit: 'em' }),
        font('post.t13.metaFontFamily', 'post.t13.customMetaFontFamily', T2_FONTS),
      ],
    },
    {
      title: 'Grade & mark',
      fields: [
        slider('post.t13.fadeHeight', 'Fade height', 20, 90, { unit: '%' }),
        slider('post.t13.fadeStrength', 'Fade strength', 0, 1, { step: 0.02 }),
        color('post.t13.overlayColor', 'Overlay'),
        slider('post.t13.overlayOpacity', 'Overlay opacity', 0, 1, { step: 0.02, unit: '%' }),
        slider('post.t13.vignetteOpacity', 'Vignette', 0, 1, { step: 0.02 }),
        image('post.t13.watermarkUrl', 'Logo', [
          toggle('post.t13.showWatermark', 'Show logo'),
          slider('post.t13.watermarkSize', 'Size', 24, 280, { unit: 'px' }),
          slider('post.t13.watermarkOpacity', 'Opacity', 0, 1, { step: 0.05, unit: '%' }),
          slider('post.t13.watermarkPosX', 'Position X', 0, 120, { unit: '%' }),
          slider('post.t13.watermarkPosY', 'Position Y', 0, 100, { unit: '%' }),
        ]),
      ],
    },
  ],

  template14: [
    {
      title: 'Content',
      fields: [
        area('post.t14.headline', 'Headline', { hint: 'Line breaks stay. Use [brackets] for accent words.' }),
        image('post.t14.bgImage', 'Background', imagePos('post.t14.')),
      ],
    },
    {
      title: 'Typography',
      fields: [
        font('post.t14.fontFamily', 'post.t14.customFontFamily'),
        slider('post.t14.fontSize', 'Size', 48, 160, { unit: 'px' }),
        select('post.t14.fontWeight', 'Weight', FONT_WEIGHTS),
        toggle('post.t14.uppercase', 'Uppercase'),
        color('post.t14.headlineColor', 'Text color'),
        color('post.t14.highlightColor', 'Highlight [ ]'),
        select('post.t14.textAlign', 'Align', ALIGN_OPTIONS),
        slider('post.t14.lineHeight', 'Line height', 0.75, 1.25, { step: 0.01 }),
        slider('post.t14.letterSpacing', 'Letter spacing', -0.04, 0.12, { step: 0.005, unit: 'em' }),
        slider('post.t14.paddingH', 'Padding X', 16, 100, { unit: 'px' }),
        slider('post.t14.paddingBottom', 'Padding bottom', 24, 140, { unit: 'px' }),
      ],
    },
    {
      title: 'Hazard rails',
      fields: [
        toggle('post.t14.showStripes', 'Side stripes'),
        slider('post.t14.stripeWidth', 'Stripe width', 8, 56, { unit: 'px' }),
        slider('post.t14.stripeSize', 'Stripe size', 6, 28, { unit: 'px' }),
        slider('post.t14.stripeAngle', 'Stripe angle', -70, -20, { step: 1 }),
        color('post.t14.stripeColorA', 'Stripe color A'),
        color('post.t14.stripeColorB', 'Stripe color B'),
      ],
    },
    {
      title: 'Grade & mark',
      fields: [
        color('post.t14.fadeColor', 'Fade color'),
        slider('post.t14.fadeHeight', 'Fade height', 20, 80, { unit: '%' }),
        slider('post.t14.fadeStrength', 'Fade strength', 0, 1, { step: 0.02 }),
        color('post.t14.overlayColor', 'Overlay'),
        slider('post.t14.overlayOpacity', 'Overlay opacity', 0, 1, { step: 0.02, unit: '%' }),
        image('post.t14.watermarkUrl', 'Logo', [
          toggle('post.t14.showWatermark', 'Show logo'),
          slider('post.t14.watermarkSize', 'Size', 24, 280, { unit: 'px' }),
          slider('post.t14.watermarkOpacity', 'Opacity', 0, 1, { step: 0.05, unit: '%' }),
          slider('post.t14.watermarkPosX', 'Position X', 0, 120, { unit: '%' }),
          slider('post.t14.watermarkPosY', 'Position Y', 0, 100, { unit: '%' }),
        ]),
      ],
    },
  ],
}

function sportsFields(prefix) {
  return [
    {
      title: 'Content',
      fields: [
        area(`${prefix}.headline`, 'Headline', { hint: 'Use [brackets] for accent words' }),
        image(`${prefix}.bgImage`, 'Background', [
          slider(`${prefix}.imageScale`, 'Zoom', 100, 250, { unit: '%' }),
          slider(`${prefix}.imagePosX`, 'Position X', 0, 100, { unit: '%' }),
          slider(`${prefix}.imagePosY`, 'Position Y', 0, 100, { unit: '%' }),
          slider(`${prefix}.bgOpacity`, 'Opacity', 0, 1, { step: 0.05, unit: '%' }),
        ]),
        image(`${prefix}.circleImage`, 'Circle inset', [
          toggle(`${prefix}.showCircle`, 'Show circle'),
          slider(`${prefix}.circleSize`, 'Size', 120, 600, { unit: 'px' }),
          slider(`${prefix}.circlePosX`, 'Position X', 0, 100, { unit: '%' }),
          slider(`${prefix}.circlePosY`, 'Position Y', 0, 100, { unit: '%' }),
          slider(`${prefix}.circleBorderWidth`, 'Border', 0, 20, { unit: 'px' }),
          color(`${prefix}.circleBorderColor`, 'Border color'),
        ]),
      ],
    },
    {
      title: 'Typography',
      fields: [
        font(`${prefix}.fontFamily`, `${prefix}.customFontFamily`),
        slider(`${prefix}.fontSize`, 'Size', 48, 180, { unit: 'px' }),
        select(`${prefix}.fontWeight`, 'Weight', FONT_WEIGHTS),
        color(`${prefix}.headlineColor`, 'Text color'),
        color(`${prefix}.highlightColor`, 'Highlight'),
        select(`${prefix}.textAlign`, 'Align', ALIGN_OPTIONS),
        slider(`${prefix}.lineHeight`, 'Line height', 0.8, 1.4, { step: 0.05 }),
        slider(`${prefix}.letterSpacing`, 'Letter spacing', -0.06, 0.12, { step: 0.005, unit: 'em' }),
        slider(`${prefix}.paddingH`, 'Padding X', 20, 80, { unit: 'px' }),
        slider(`${prefix}.paddingBottom`, 'Padding bottom', 40, 180, { unit: 'px' }),
      ],
    },
    {
      title: 'Brand & grade',
      fields: [
        text(`${prefix}.brandText`, 'Brand', { togglePath: `${prefix}.showBrand` }),
        font(`${prefix}.brandFontFamily`, `${prefix}.customBrandFontFamily`),
        color(`${prefix}.brandColor`, 'Brand color'),
        slider(`${prefix}.brandFontSize`, 'Brand size', 16, 48, { unit: 'px' }),
        slider(`${prefix}.brandLetterSpacing`, 'Brand spacing', -0.04, 0.2, { step: 0.005, unit: 'em' }),
        toggle(`${prefix}.brandItalic`, 'Italic brand'),
        slider(`${prefix}.gradientStart`, 'Gradient start', 0, 60, { unit: '%' }),
        slider(`${prefix}.gradientStrength`, 'Gradient strength', 0, 1, { step: 0.02 }),
        color(`${prefix}.overlayColor`, 'Overlay'),
        slider(`${prefix}.overlayOpacity`, 'Overlay opacity', 0, 1, { step: 0.02, unit: '%' }),
        text(`${prefix}.swipeText`, 'Swipe text', { togglePath: `${prefix}.showSwipe` }),
        font(`${prefix}.swipeFontFamily`, `${prefix}.customSwipeFontFamily`, T2_FONTS),
        slider(`${prefix}.swipeFontSize`, 'Swipe size', 14, 48, { unit: 'px' }),
        slider(`${prefix}.swipeLetterSpacing`, 'Swipe spacing', 0, 0.5, { step: 0.01, unit: 'em' }),
        color(`${prefix}.swipeColor`, 'Swipe color'),
        toggle(`${prefix}.showDots`, 'Dots'),
        slider(`${prefix}.dotCount`, 'Dot count', 2, 8, { step: 1 }),
        slider(`${prefix}.activeDot`, 'Active dot', 0, 7, { step: 1 }),
        color(`${prefix}.dotColor`, 'Dot color'),
      ],
    },
  ]
}
