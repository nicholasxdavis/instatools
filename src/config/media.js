/** Public CDN for default demo media (CORS-friendly via jsDelivr). */
export const CDN_ORIGIN = 'https://cdn.jsdelivr.net/gh/nicholasxdavis/instatools-cdn@master/src'

/** Local Vite public path used in development for faster offline editing. */
const LOCAL_HOLDER = '/holder'

const H = import.meta.env.DEV ? LOCAL_HOLDER : `${CDN_ORIGIN}/holder`

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
}
