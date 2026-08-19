import { getDefaultThemeSlice } from '@/themes/defaults'
import { templateStateKey } from '@/utils/text'
import { clone } from '@/utils/media'

/** Build a minimal post object containing only the active template slice. */
export function buildDesignPost(post) {
  if (!post?.template) return null
  const templateId = post.template
  const key = templateStateKey(templateId)
  const minimal = { template: templateId }

  if (key === 'style') {
    minimal.headline = post.headline
    minimal.caption = post.caption
    minimal.bgImage = post.bgImage
    minimal.style = clone(post.style)
  } else {
    minimal[key] = clone(post[key])
  }

  return minimal
}

export function validateDesignPost(post) {
  if (!post?.template) return false
  const key = templateStateKey(post.template)
  if (key === 'style') return post.style && typeof post.style === 'object'
  return post[key] && typeof post[key] === 'object'
}

/** Merge a minimal design post onto an existing post state. */
export function mergeDesignPost(existingPost, designPost) {
  if (!designPost?.template) return existingPost
  const key = templateStateKey(designPost.template)
  const next = { ...existingPost, template: designPost.template }

  if (key === 'style') {
    if (designPost.headline != null) next.headline = designPost.headline
    if (designPost.caption != null) next.caption = designPost.caption
    if (designPost.bgImage != null) next.bgImage = designPost.bgImage
    next.style = { ...getDefaultThemeSlice('style'), ...(designPost.style || {}) }
  } else {
    next[key] = { ...getDefaultThemeSlice(key), ...(designPost[key] || {}) }
  }

  return next
}

export function parseImportedDesign(raw) {
  let data = raw
  if (typeof raw === 'string') {
    data = JSON.parse(raw)
  }

  if (data?.type === 'instatools-design' && data.design?.post) {
    return {
      mode: data.design.mode,
      post: data.design.post,
      extras: 0,
    }
  }

  if (data?.design?.post) {
    return {
      mode: data.design.mode,
      post: data.design.post,
      extras: 0,
    }
  }

  if (data?.post?.template && data.id != null && typeof data.name === 'string') {
    return {
      mode: data.mode,
      post: data.post,
      extras: 0,
    }
  }

  if (data?.post?.template) {
    return {
      mode: data.mode,
      post: data.post,
      extras: 0,
    }
  }

  if (Array.isArray(data?.presets) && data.presets.length) {
    const first = data.presets[0]
    if (!first?.post) throw new Error('No valid design found in preset file.')
    return {
      mode: first.mode,
      post: first.post,
      extras: data.presets.length - 1,
    }
  }

  if (Array.isArray(data) && data.length && data[0]?.post) {
    return {
      mode: data[0].mode,
      post: data[0].post,
      extras: data.length - 1,
    }
  }

  throw new Error('Unrecognized file. Export a design from Instatools or use a saved design JSON.')
}

export function designExportPayload(mode, post) {
  const minimal = buildDesignPost(post)
  if (!minimal) throw new Error('Nothing on the canvas to export.')
  return {
    version: 2,
    type: 'instatools-design',
    exportDate: new Date().toISOString(),
    design: {
      mode: mode === 'highlight' ? 'post' : (mode || 'post'),
      post: minimal,
    },
  }
}

export function downloadDesignJson(payload, filenameBase) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filenameBase
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
