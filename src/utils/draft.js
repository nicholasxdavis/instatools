import { presetsForStorage, clone } from '@/utils/media'
import { DRAFT_KEY } from '@/config/constants'

export function readDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.post?.template) return null
    return parsed
  } catch {
    return null
  }
}

export function writeDraft(payload) {
  if (!payload?.post?.template) return false
  const stamped = {
    v: 1,
    savedAt: new Date().toISOString(),
    mode: payload.mode || 'post',
    post: clone(payload.post),
  }

  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(stamped))
    return true
  } catch {
    try {
      const stripped = {
        ...stamped,
        post: presetsForStorage(stamped.post),
      }
      localStorage.setItem(DRAFT_KEY, JSON.stringify(stripped))
      return true
    } catch {
      return false
    }
  }
}

export function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY)
    return true
  } catch {
    return false
  }
}

export function draftFingerprint(post, mode = 'post') {
  try {
    return JSON.stringify({ mode, post: presetsForStorage(clone(post)) })
  } catch {
    return ''
  }
}
