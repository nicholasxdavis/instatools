import { publicUrl } from '@/utils/publicUrl'

/** Public CDN for default demo media (CORS-friendly via jsDelivr). */
export const CDN_ORIGIN = 'https://cdn.jsdelivr.net/gh/nicholasxdavis/instatools-cdn@master/src'

/** Local Vite public path used in development for faster offline editing. */
const H = import.meta.env.DEV ? publicUrl('holder') : `${CDN_ORIGIN}/holder`
const T = import.meta.env.DEV ? publicUrl('textures') : `${CDN_ORIGIN}/textures`

export const TEXTURES = {
  brickwall: `${T}/brickwall.png`,
  crosslineDots: `${T}/crossline-dots.png`,
  diagonales: `${T}/diagonales_decalees.png`,
  doubleBubble: `${T}/double-bubble.png`,
  hypnotize: `${T}/hypnotize.webp`,
  niceSnow: `${T}/nice_snow.webp`,
  pipes: `${T}/pipes.png`,
  repeatedSquare: `${T}/repeated-square.png`,
  ripples: `${T}/ripples.png`,
  sports: `${T}/sports.png`,
  stripesLight: `${T}/stripes-light.png`,
  swirl: `${T}/swirl_pattern.png`,
  tinySquares: `${T}/tiny-squares.png`,
  whatTheHex: `${T}/what-the-hex.webp`,
  whiteWaves: `${T}/white-waves.webp`,
}

export function textureUrl(id) {
  return TEXTURES[id] || ''
}

export const MEDIA = {
  obama: `${H}/obama.jpg`,
  aliens: `${H}/aliens.jpg`,
  watermark: `${H}/watermark.png`,
  trump: `${H}/trump.jpg`,
  njLogo: `${H}/nj-logo.png`,
  lilOt: `${H}/lil-ot.png`,
  hamilton: `${H}/hamilton.jpg`,
  tankDell: `${H}/tank-dell.jpg`,
  tankDellCircle: `${H}/tank-dell-circle.jpg`,
  anthonyDavis: `${H}/anthony-davis.jpg`,
  anthonyDavisCircle: `${H}/anthony-davis-circle.jpg`,
  toad: `${H}/toad.webp`,
  toadLogo: `${H}/toad-logo.png`,
  clark: `${H}/clark.jpg`,
  akonCity: `${H}/akon-city.webp`,
  elonMusk: `${H}/elon-musk.jpg`,
  capitol: `${H}/capitol.jpg`,
  travisCenter: `${H}/travis-center.png`,
  travisLeft: `${H}/travis-left.png`,
  travisRight: `${H}/travis-right.png`,
  yeat1: `${H}/yeat1.png`,
  yeat2: `${H}/yeat2.png`,
  yeat3: `${H}/yeat3.png`,
  allM8Logo: `${H}/all-m8-logo.png`,
  allM8Dashboard: `${H}/all-m8-dashboard.webp`,
  store: `${H}/store.jpg`,
  randomCeoLady: `${H}/random-ceo-lady.webp`,
}
