export function getImageTransform(scale = 100, posY = 50) {
  const scaleFactor = scale / 100
  if (scaleFactor === 1) return 'none'
  const offsetFromCenter = (posY - 50) / 100
  const translateY = offsetFromCenter * 100 * (scaleFactor - 1)
  return `scale(${scaleFactor}) translateY(${translateY}%)`
}

export function getObjectPositionY(pos = 50, scale = 100) {
  return scale / 100 === 1 ? pos : 50
}

export function coverImageStyle({ posX = 50, posY = 50, scale = 100, opacity = 1 } = {}) {
  return {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: `${posX}% ${getObjectPositionY(posY, scale)}%`,
    transform: getImageTransform(scale, posY),
    transformOrigin: 'center center',
    opacity,
  }
}

export function watermarkPlacement(posX = 50, posY = 50) {
  const clampedY = Math.max(0, Math.min(100, posY))
  const x = Math.max(0, posX)

  let transformX = '-50%'
  let transformY = '-50%'
  let left = null
  let right = null
  let top = null
  let bottom = null

  if (clampedY <= 15) {
    transformY = '0%'
    top = `${clampedY}%`
  } else if (clampedY >= 85) {
    transformY = '0%'
    bottom = `${100 - clampedY}%`
  } else {
    top = `${clampedY}%`
  }

  if (x <= 15) {
    transformX = '0%'
    left = `${Math.min(100, x)}%`
  } else if (x >= 85) {
    transformX = '0%'
    right = `${100 - x}%`
  } else {
    left = `${x}%`
  }

  const style = {
    position: 'absolute',
    transform: `translate(${transformX}, ${transformY})`,
  }
  if (left !== null) style.left = left
  if (right !== null) style.right = right
  if (top !== null) style.top = top
  if (bottom !== null) style.bottom = bottom
  return style
}

export function hexToRgb(hex = '#000000') {
  const value = hex.replace('#', '')
  if (value.length !== 6) return { r: 0, g: 0, b: 0 }
  return {
    r: parseInt(value.slice(0, 2), 16) || 0,
    g: parseInt(value.slice(2, 4), 16) || 0,
    b: parseInt(value.slice(4, 6), 16) || 0,
  }
}
