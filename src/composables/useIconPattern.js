import { onBeforeUnmount, onMounted, ref } from 'vue'
import { publicUrl } from '@/utils/publicUrl'

export function useIconPattern() {
  const iconLayer = ref(null)
  let resizeTimer = 0

  function paintIcons() {
    const layer = iconLayer.value
    if (!layer) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      layer.innerHTML = ''
      return
    }
    const iconPaths = [
      publicUrl('iconarmy/camera-svgrepo-com.svg'),
      publicUrl('iconarmy/favorite-svgrepo-com.svg'),
      publicUrl('iconarmy/flash-svgrepo-com.svg'),
      publicUrl('iconarmy/instagram-167-svgrepo-com.svg'),
      publicUrl('iconarmy/tools-svgrepo-com.svg'),
    ]
    const random = (min, max) => Math.random() * (max - min) + min
    layer.innerHTML = ''
    const cellSize = 220
    const cols = Math.ceil(window.innerWidth / cellSize)
    const rows = Math.ceil(Math.min(window.innerHeight, 900) / cellSize)
    const fragment = document.createDocumentFragment()
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        if (Math.random() < 0.28) continue
        const icon = document.createElement('span')
        const size = random(96, 128)
        const x = (col + 0.5) * cellSize + random(-28, 28)
        const y = (row + 0.5) * cellSize + random(-28, 28)
        icon.className = 'icon-pattern-item'
        icon.style.left = `${x - size / 2}px`
        icon.style.top = `${y - size / 2}px`
        icon.style.width = `${size}px`
        icon.style.height = `${size}px`
        icon.style.opacity = random(0.05, 0.1).toFixed(3)
        icon.style.transform = `rotate(${random(-24, 24).toFixed(1)}deg)`
        icon.style.backgroundImage = `url("${iconPaths[(row * cols + col) % iconPaths.length]}")`
        fragment.appendChild(icon)
      }
    }
    layer.appendChild(fragment)
  }

  function onResize() {
    window.clearTimeout(resizeTimer)
    resizeTimer = window.setTimeout(paintIcons, 160)
  }

  onMounted(() => {
    paintIcons()
    window.addEventListener('resize', onResize, { passive: true })
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', onResize)
    window.clearTimeout(resizeTimer)
  })

  return { iconLayer }
}
