function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Deterministic wash-pattern icon positions for preview + export. */
export function buildWashPatternLayout({
  width,
  height,
  count = 10,
  iconSize = 96,
  gap = 120,
  random = true,
  jitter = 36,
  padTop = 20,
  padLeft = 24,
  padRight = 24,
  padBottom = 24,
  seed = 7,
}) {
  const w = Math.max(1, width)
  const h = Math.max(1, height)
  const size = Math.max(8, iconSize)
  const step = size + Math.max(0, gap)
  const top = Math.max(0, padTop)
  const left = Math.max(0, padLeft)
  const right = Math.max(0, padRight)
  const bottom = Math.max(0, padBottom)
  const rand = mulberry32(Number(seed) || 7)
  const maxX = Math.max(left, w - right - size)
  const maxY = Math.max(top, h - bottom - size)

  const grid = []
  for (let y = top; y <= maxY + 0.5; y += step) {
    for (let x = left; x <= maxX + 0.5; x += step) {
      grid.push({ x, y })
    }
  }

  const n = Math.max(1, Math.min(48, Math.round(count)))
  let items = grid.slice(0, n)
  while (items.length < n) {
    items.push({
      x: left + rand() * Math.max(0, maxX - left),
      y: top + rand() * Math.max(0, maxY - top),
    })
  }

  if (random && jitter > 0) {
    const j = jitter
    items = items.map((p) => ({
      x: Math.min(maxX, Math.max(left, p.x + (rand() * 2 - 1) * j)),
      y: Math.min(maxY, Math.max(top, p.y + (rand() * 2 - 1) * j)),
    }))
  }

  return items
}
