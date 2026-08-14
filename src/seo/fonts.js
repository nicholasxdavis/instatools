const DESIGN_FONTS =
  'https://fonts.googleapis.com/css2?family=Anton&family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Montserrat:wght@400;700;900&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,700;0,6..72,800;1,6..72,400&family=Oswald:wght@500;700&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Poppins:wght@400;700;900&family=Roboto+Condensed:wght@400;700&family=Teko:wght@400;600;700&family=Rubik+Dirt&display=swap'

export function loadDesignFonts() {
  if (typeof document === 'undefined') return
  if (document.getElementById('design-fonts')) return

  const link = document.createElement('link')
  link.id = 'design-fonts'
  link.rel = 'stylesheet'
  link.href = DESIGN_FONTS
  link.media = 'print'
  link.onload = () => {
    link.media = 'all'
  }
  document.head.appendChild(link)
}
