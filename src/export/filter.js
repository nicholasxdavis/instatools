let cachedGrainUrl = ''

function buildGrainTile(tileSize = 180) {
  const canvas = document.createElement('canvas')
  canvas.width = tileSize
  canvas.height = tileSize
  const ctx = canvas.getContext('2d')
  const image = ctx.createImageData(tileSize, tileSize)
  const data = image.data
  for (let i = 0; i < data.length; i += 4) {
    const value = (Math.random() * 255) | 0
    data[i] = value
    data[i + 1] = value
    data[i + 2] = value
    data[i + 3] = 255
  }
  ctx.putImageData(image, 0, 0)
  return canvas
}

export function applyGrain(ctx, width, height, amount) {
  if (!amount || amount <= 0) return
  const tile = buildGrainTile(180)
  const pattern = ctx.createPattern(tile, 'repeat')
  ctx.save()
  ctx.filter = 'contrast(1.6) brightness(1.05)'
  ctx.globalAlpha = Math.min(1, amount * 1.6)
  ctx.globalCompositeOperation = 'multiply'
  ctx.fillStyle = pattern
  ctx.fillRect(0, 0, width, height)
  ctx.restore()
}

export function getGrainDataUrl(tileSize = 180) {
  if (!cachedGrainUrl) {
    cachedGrainUrl = buildGrainTile(tileSize).toDataURL('image/png')
  }
  return cachedGrainUrl
}

if (typeof window !== 'undefined') {
  window.applyGrain = applyGrain
  window.getGrainDataUrl = getGrainDataUrl
}
