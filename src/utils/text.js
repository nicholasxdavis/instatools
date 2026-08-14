export function parseHeadline(text, options = {}) {
  const {
    color = '#FFFFFF',
    highlight = '#FF5500',
    secondary = '#3B82F6',
    useBrackets = true,
    useBraces = false,
  } = options

  const source = String(text ?? '')
  const regex = useBraces ? /(\[.*?\]|\{.*?\})/g : /(\[.*?\])/g

  return source.split(regex).filter((part) => part !== '').map((part) => {
    if (part.startsWith('[') && part.endsWith(']')) {
      return {
        text: part.slice(1, -1),
        color: useBrackets ? highlight : color,
      }
    }
    if (part.startsWith('{') && part.endsWith('}')) {
      return {
        text: part.slice(1, -1),
        color: useBraces ? secondary : color,
      }
    }
    return { text: part, color }
  })
}

export function templateStateKey(templateId) {
  if (!templateId || templateId === 'template1') return 'style'
  return templateId.replace('template', 't')
}
