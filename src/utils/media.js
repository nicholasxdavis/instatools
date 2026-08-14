function videoBlobSet() {
  if (typeof window === 'undefined') return null
  if (!window.__instatoolsVideoBlobs) window.__instatoolsVideoBlobs = new Set()
  return window.__instatoolsVideoBlobs
}

export function markVideoSource(src) {
  if (src) videoBlobSet()?.add(src)
}

export function isVideoSource(src) {
  if (!src || typeof src !== 'string') return false
  const value = src.trim().toLowerCase()
  if (!value) return false
  if (value.startsWith('data:video/')) return true
  if (videoBlobSet()?.has(src)) return true
  return /\.(mp4|webm|mov|m4v|ogv|ogg)(\?|#|$)/i.test(value)
}

export function postHasVideo(post) {
  if (!post) return false
  const style = post.style || {}
  const slices = [post.t2, post.t3, post.t4, post.t5, post.t6, post.t7, post.t8, post.t9, post.t10]
  const urls = [
    post.bgImage,
    style.overlayImgUrl,
    style.logoUrl,
    style.watermarkUrl,
    ...slices.flatMap((slice) => (slice ? Object.values(slice) : [])),
  ]
  return urls.some((value) => typeof value === 'string' && isVideoSource(value))
}

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export function readMediaFile(file) {
  if (file?.type?.startsWith('video/')) {
    const url = URL.createObjectURL(file)
    markVideoSource(url)
    return Promise.resolve(url)
  }
  return readFileAsDataUrl(file)
}

export function presetsForStorage(presets) {
  function walk(value) {
    if (value == null) return value
    if (typeof value === 'string') {
      if (value.startsWith('data:') || value.startsWith('blob:')) return ''
      return value
    }
    if (Array.isArray(value)) return value.map(walk)
    if (typeof value === 'object') {
      const out = {}
      for (const key of Object.keys(value)) out[key] = walk(value[key])
      return out
    }
    return value
  }
  return walk(presets)
}

export function getByPath(obj, path) {
  return path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), obj)
}

export function setByPath(obj, path, value) {
  const parts = path.split('.')
  let cursor = obj
  for (let i = 0; i < parts.length - 1; i += 1) {
    const key = parts[i]
    if (cursor[key] == null || typeof cursor[key] !== 'object') {
      cursor[key] = {}
    }
    cursor = cursor[key]
  }
  cursor[parts[parts.length - 1]] = value
}

export function clone(value) {
  return JSON.parse(JSON.stringify(value))
}
