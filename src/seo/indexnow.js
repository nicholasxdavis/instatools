import { SITE, absoluteUrl } from './site.js'

export const INDEXNOW = {
  key: 'c3a91f8e6b2d4a7c9e1f0d5b8a6c4e27',
  host: 'www.useinstatools.com',
}

export function indexNowKeyLocation() {
  return absoluteUrl(`/${INDEXNOW.key}.txt`)
}

export function indexNowKeyBody() {
  return `${INDEXNOW.key}\n`
}
