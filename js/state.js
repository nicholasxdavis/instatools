/**
 * Application State Management
 * Contains state, constants, templates, and icon mappings
 */

// --- STATE MANAGEMENT ---
const PRESETS_KEY = "ig_news_gen_presets_vanilla_v1";
const NOISE_SVG = `data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E`;

const state = {
  mode: "post", // 'post' | 'highlight'
  activeTab: "editor",
  isExporting: false,
  manualZoom: null, // null = auto-fit, number = manual zoom level (0.1 to 4.0)

  // Post State
  post: {
    template: "template1", // 'template1' | 'template2' | 'template3' | 'template4' | 'template5' | 'template6'
    headline: "OBAMA CLAIMS [ALIENS] ARE {REAL}",
    caption: "He also denied that they're being held at Area 51",
    bgImage:
      "https://raw.githubusercontent.com/nicholasxdavis/ptm/main/holder/obama.webp",

    // Template 2 state (simple: white top bar, image below, watermark BL)
    t2: {
      headline: "Donald Trump Says 'I Don't Like Young Handsome Men'",
      bgImage:
        "https://dims.apnews.com/dims4/default/ecd7c9e/2147483647/strip/true/crop/2993x1995+0+0/resize/1020x680!/quality/90/?url=https%3A%2F%2Fassets.apnews.com%2F2e%2F49%2F3567936f86ceb8625b25f35d975d%2Fff97e8a599a442ba8d7016a4b29f03c4",
      fontFamily: "DM Sans",
      customFontFamily: "",
      fontSize: 67,
      watermarkUrl:
        "https://cdn.shopify.com/s/files/1/0114/9403/1418/files/nj_logo_300x_300_1.png?v=1602025721",
      watermarkSize: 201,
      watermarkOpacity: 0.61,
      showWatermark: true,
      watermarkPosX: 3,
      watermarkPosY: 99,
      imagePosX: 50,
      imagePosY: 50,
      imageScale: 100,
      fontWeight: 400,
    },

    // Template 5 state (Dual Image: two side-by-side photos + colored headline text block + arrow + dots)
    t5: {
      headline: "[LIL OT] ON GROWING\nUP AROUND [SGA] IN\n[HAMILTON]",
      imageLeft:
        "https://static1.squarespace.com/static/5b6c884571069910870ca73b/5f7d07a92ccebf372851802b/5ffb8bd78df9662d1041322d/1765242963061/Lil+Ot.png?format=1500w",
      imageRight:
        "https://theheartofontario.com/wp-content/uploads/2018/03/OPERATOR-Hamilton-International-Village-3-1440x893.jpg",
      leftPosX: 50,
      leftPosY: 21,
      leftScale: 100,
      rightPosX: 31,
      rightPosY: 3,
      rightScale: 100,
      imageSplit: 65,
      fontFamily: "Archivo Black",
      customFontFamily: "",
      fontSize: 87,
      fontWeight: 400,
      headlineColor: "#FFFFFF",
      highlightColor: "#FF0000",
      lineHeight: 0.85,
      letterSpacing: -0.02,
      bgColor: "#000000",
      textAlign: "left",
      paddingH: 20,
      paddingV: 20,
      showWatermark: false,
      watermarkUrl:
        "https://github.com/nicholasxdavis/ptm/blob/main/holder/example-watermark.png?raw=true",
      watermarkSize: 200,
      watermarkOpacity: 1.0,
      watermarkPosX: 50,
      watermarkPosY: 10,
      showArrow: false,
      arrowColor: "#FFFFFF",
      showDots: false,
      dotCount: 4,
      activeDot: 0,
      dotColor: "#FFFFFF",
      imageSeparator: false,
      separatorColor: "#FFFFFF",
      separatorWidth: 2,
    },

    // Template 6 state (Sports / Hurdels style: full-bleed bg + cinematic gradient + circle inset + brand text + headline + >>> SWIPE >>> + dots)
    t6: {
      headline: "TANK DELL'S\nKNEE WILL [NEVER]\nBE THE SAME",
      bgImage:
        "https://statico.profootballnetwork.com/wp-content/uploads/2025/11/18192053/how-long-will-tank-dell-11-19-25-scaled.jpg",
      imagePosX: 46,
      imagePosY: 14,
      imageScale: 100,
      bgOpacity: 1.0,
      // Cinematic multi-stop gradient (bottom-heavy)
      gradientStart: 22, // % from top where darkening begins (0-60)
      gradientStrength: 0.96, // max darkness reached at the very bottom (0-1)
      // Optional flat dim overlay
      overlayColor: "#000000",
      overlayOpacity: 0.08,
      // Headline
      headlineColor: "#FFFFFF",
      highlightColor: "#FF0000",
      fontFamily: "Archivo Black",
      customFontFamily: "",
      fontSize: 94,
      fontWeight: 400,
      textAlign: "left",
      lineHeight: 1.0,
      letterSpacing: -0.023,
      paddingH: 44, // horizontal padding (px)
      paddingBottom: 114, // bottom padding to leave room for swipe+dots (px)
      // Brand text (top-left)
      showBrand: true,
      brandText: "INSTATOOLS",
      brandColor: "#FFFFFF",
      brandFontSize: 28,
      brandFontFamily: "Archivo Black",
      brandItalic: false,
      // Circle inset (top-right area)
      showCircle: true,
      circleImage:
        "https://images2.minutemediacdn.com/image/upload/c_fill,w_1200,ar_1:1,f_auto,q_auto,g_auto/images/voltaxMediaLibrary/mmsport/si/01jfndr1hevtmpvqwr9x.jpg",
      circlePosX: 76, // % from left (center of circle)
      circlePosY: 51, // % from top  (center of circle)
      circleSize: 400, // diameter in px at canvas scale
      circleBorderColor: "#EF4444",
      circleBorderWidth: 6,
      // >>> SWIPE >>> bottom element
      showSwipe: true,
      swipeText: "SWIPE",
      swipeColor: "#FFFFFF",
      swipeFontSize: 30,
      swipeFontFamily: "Bebas Neue",
      // Pagination dots
      showDots: false,
      dotCount: 4,
      activeDot: 0,
      dotColor: "#FFFFFF",
    },

    // Template 4 state (Magazine Cover style: XXL-inspired, full bleed + brand badge + swipe + dots)
    t4: {
      headline: "Akon City has been scrapped",
      bgImage:
        "https://assets.bwbx.io/images/users/iqjWHBFdfxIU/i_ilYKBV3dU0/v0/-1x-1.webp",
      fontFamily: "Archivo Black",
      customFontFamily: "",
      fontSize: 95,
      fontWeight: 400,
      headlineColor: "#FFFFFF",
      lineHeight: 1.0,
      letterSpacing: -0.02,
      badgeText: "NEWS",
      showBadge: true,
      brandText: "XXL",
      brandBgColor: "#CC0000",
      brandTextColor: "#FFFFFF",
      brandFontSize: 38,
      showBrand: true,
      swipeText: "Swipe Left",
      showSwipe: true,
      swipeColor: "#FFFFFF",
      swipeFontSize: 22,
      showDivider: true,
      dividerColor: "#FFFFFF",
      showDots: true,
      dotCount: 3,
      activeDot: 1,
      dotColor: "#FFFFFF",
      overlayColor: "#000000",
      overlayOpacity: 0.35,
      gradientStrength: 85,
      imagePosX: 50,
      imagePosY: 25,
      imageScale: 100,
    },

    // Template 3 state (Wealth style: image top, brand divider, bold yellow text bottom)
    t3: {
      headline: "HOW MANY MILLIONAIRES AND BILLIONAIRES EXIST IN THE WORLD",
      bgImage:
        "https://cdn.britannica.com/45/223045-050-A6453D5D/Telsa-CEO-Elon-Musk-2014.jpg",
      fontFamily: "Oswald",
      customFontFamily: "",
      fontSize: 86,
      fontStyle: "normal",
      fontWeight: 700,
      headlineColor: "#FFD800",
      bgColor: "#0a0a0a",
      imageSplit: 57,
      imagePosX: 89,
      imagePosY: 0,
      imageScale: 100,
      brandName: "ealth",
      brandLetter: "w",
      showBrandLetter: true,
      brandColor: "#FFFFFF",
      showBrand: true,
      brandSize: 37,
      lineHeight: 1.15,
      letterSpacing: 0,
      showBgColor: true,
      showBottomFade: true,
      bottomFadeColor: "#0a0a0a",
      bottomFadeOpacity: 1.0,
      bottomFadeHeight: 79,
      bottomFadePosY: 0,
    },

    style: {
      fontFamily: "Archivo Black",
      customFontFamily: "",
      primaryColor: "#FFFFFF",
      highlightColor: "#FF5500",
      secondaryColor: "#3B82F6",
      useBracketColor: true,
      useBraceColor: true,
      overlayColor: "#000000",
      overlayOpacity: 0.5,
      fontSize: 85,
      lineHeight: 0.9,
      letterSpacing: -0.02,
      logoUrl: "",
      logoSize: 150,
      logoOpacity: 1.0,
      showSwipeBadge: true,
      swipeText: "Swipe Left",
      swipeFontSize: 20,
      swipeFontFamily: "Inter",
      customSwipeFontFamily: "",
      swipeTextColor: "#FFFFFF",
      swipeColor: "#FFFFFF",
      swipeOpacity: 0.9,
      swipeLetterSpacing: 0.1,
      swipeShowIcon: true,
      swipeIconSize: 24,
      showNewsBadge: true,
      showSource: true,
      badgeText: "NEWS",
      sourceText: "SOURCE: GITHUB",
      imagePosX: 50,
      imagePosY: 50,
      imageScale: 100,
      bgOpacity: 1.0,
      bgNoise: 0.0,
      overlayImgUrl:
        "https://raw.githubusercontent.com/nicholasxdavis/ptm/main/holder/aliens.jpg",
      overlayImgSize: 450,
      overlayImgPosX: 74,
      overlayImgPosY: 65,
      overlayBorderWidth: 12,
      overlayBorderColor: "#FF5500",
      showOverlayBorder: true,
      showOverlayGlow: false,
      overlayGlowColor: "#FF5500",
      overlayGlowIntensity: 0.5,
      overlayGlowSize: 1.0,
      overlayNoise: 0.0,
      watermarkUrl:
        "https://raw.githubusercontent.com/nicholasxdavis/ptm/main/holder/example-watermark.png",
      watermarkSize: 323,
      watermarkPosX: 0,
      watermarkPosY: 0,
      watermarkOpacity: 0.8,
      showWatermark: true,
    },
    sources: { bg: "GITHUB", overlay: "GITHUB", watermark: "GITHUB" },
  },

  // Highlight State
  highlight: {
    iconType: "icon", // 'icon' | 'custom' | 'fa'
    iconName: "Mic",
    customIconUrl: "",
    faClass: "",
    bgColor: "#000000",
    showBgImage: true,
    bgImage: "",
    bgOpacity: 1.0,
    imageScale: 100,
    imagePosX: 50,
    imagePosY: 50,
    ringColor: "#FF5500",
    iconColor: "#FFFFFF",
    ringWidth: 15,
    iconSize: 400,
  },

  presets: [],
};

const CONSTANTS = {
  POST_WIDTH: 1080,
  POST_HEIGHT: 1350,
  HIGHLIGHT_SIZE: 1080,
  FONTS: [
    "Google Sans",
    "Arial",
    "Archivo Black",
    "Anton",
    "Bebas Neue",
    "Inter",
    "Montserrat",
    "Oswald",
    "Poppins",
    "Roboto Condensed",
    "Teko",
  ],
  COLORS: [
    "#FF5500",
    "#EF4444",
    "#3B82F6",
    "#10B981",
    "#A855F7",
    "#EAB308",
    "#000000",
    "#FFFFFF",
    "#06B6D4",
    "#EC4899",
    "#84CC16",
    "#6366F1",
    "#F97316",
    "#14B8A6",
  ],
};

// --- TEMPLATES SYSTEM ---
const SYSTEM_TEMPLATES = [
  {
    id: "template1",
    name: "News (Classic)",
    previewImage: "src/ui/templates/template1.png",
    templateId: "template1",
    style: {
      fontFamily: "Archivo Black",
      customFontFamily: "",
      primaryColor: "#FFFFFF",
      highlightColor: "#FF5500",
      secondaryColor: "#3B82F6",
      useBracketColor: true,
      useBraceColor: true,
      overlayColor: "#000000",
      overlayOpacity: 0.5,
      fontSize: 85,
      lineHeight: 0.9,
      letterSpacing: -0.02,
      imagePosX: 50,
      imagePosY: 50,
      imageScale: 100,
      bgOpacity: 1.0,
      bgNoise: 0.0,
      overlayImgSize: 450,
      overlayImgPosX: 74,
      overlayImgPosY: 65,
      overlayBorderWidth: 12,
      overlayBorderColor: "#FF5500",
      showOverlayBorder: true,
      showOverlayGlow: false,
      overlayGlowColor: "#FF5500",
      overlayGlowIntensity: 0.5,
      overlayGlowSize: 1.0,
      overlayNoise: 0.0,
      watermarkSize: 323,
      watermarkPosX: 0,
      watermarkPosY: 0,
      watermarkOpacity: 0.8,
      showWatermark: true,
      showSwipeBadge: true,
      swipeText: "Swipe Left",
      swipeFontSize: 20,
      swipeFontFamily: "Inter",
      customSwipeFontFamily: "",
      swipeTextColor: "#FFFFFF",
      swipeColor: "#FFFFFF",
      swipeOpacity: 0.9,
      swipeLetterSpacing: 0.1,
      swipeShowIcon: true,
      swipeIconSize: 24,
      showNewsBadge: true,
      showSource: true,
      badgeText: "NEWS",
      sourceText: "SOURCE: GITHUB",
    },
  },
  {
    id: "template2",
    name: "Clean (No Jumper)",
    previewImage: "src/ui/templates/template2.png",
    templateId: "template2",
  },
  {
    id: "template3",
    name: "Wealth (Split)",
    previewImage: "src/ui/templates/template3.png",
    templateId: "template3",
  },
  {
    id: "template4",
    name: "Magazine (XXL)",
    previewImage: "src/ui/templates/template4.png",
    templateId: "template4",
  },
  {
    id: "template5",
    name: "Dual Image",
    previewImage: "src/ui/templates/template5.png",
    templateId: "template5",
  },
  {
    id: "template6",
    name: "Sports (Hurdels)",
    previewImage: "src/ui/templates/template6.png",
    templateId: "template6",
  },
];

// Icon mapping for highlight generator
const HIGHLIGHT_ICON_MAP = {
  Mic: "mic",
  Music: "music",
  Video: "video",
  Zap: "zap",
  Star: "star",
  Heart: "heart",
  Trophy: "trophy",
  Flame: "flame",
  Play: "play",
  Camera: "camera",
  Headphones: "headphones",
  Radio: "radio",
  Tv: "tv",
  Smartphone: "smartphone",
  Laptop: "laptop",
  Gamepad: "gamepad-2",
  Dumbbell: "dumbbell",
  Plane: "plane",
  ShoppingBag: "shopping-bag",
  Shirt: "shirt",
  DollarSign: "dollar-sign",
  TrendingUp: "trending-up",
  Users: "users",
  MessageCircle: "message-circle",
  Calendar: "calendar",
  MapPin: "map-pin",
  Instagram: "instagram",
  Twitter: "twitter",
  Facebook: "facebook",
  Youtube: "youtube",
  Globe: "globe",
  Check: "check",
};

// Store initial default configurations
const DEFAULT_TEMPLATE_STATES = {
  t2: JSON.parse(JSON.stringify(state.post.t2)),
  t3: JSON.parse(JSON.stringify(state.post.t3)),
  t4: JSON.parse(JSON.stringify(state.post.t4)),
  t5: JSON.parse(JSON.stringify(state.post.t5)),
  t6: JSON.parse(JSON.stringify(state.post.t6)),
};

// Make globally available
if (typeof window !== "undefined") {
  window.PRESETS_KEY = PRESETS_KEY;
  window.NOISE_SVG = NOISE_SVG;
  window.state = state;
  window.DEFAULT_TEMPLATE_STATES = DEFAULT_TEMPLATE_STATES;
  window.CONSTANTS = CONSTANTS;
  window.SYSTEM_TEMPLATES = SYSTEM_TEMPLATES;
  window.HIGHLIGHT_ICON_MAP = HIGHLIGHT_ICON_MAP;
}
