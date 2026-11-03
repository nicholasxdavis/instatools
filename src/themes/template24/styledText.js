/** Parse `[bold]` and `{italic}` runs over a base weight/style. */
export function parseStyledRuns(text, baseWeight = 600, baseStyle = 'normal') {
  const src = String(text ?? '')
  const runs = []
  const re = /(\[[^\]]*\]|\{[^}]*\})/g
  let last = 0
  let match
  while ((match = re.exec(src))) {
    if (match.index > last) {
      runs.push({ text: src.slice(last, match.index), weight: baseWeight, style: baseStyle })
    }
    const token = match[0]
    const body = token.slice(1, -1)
    if (token.startsWith('[')) {
      runs.push({ text: body, weight: 800, style: baseStyle })
    } else {
      runs.push({ text: body, weight: baseWeight, style: 'italic' })
    }
    last = match.index + token.length
  }
  if (last < src.length) {
    runs.push({ text: src.slice(last), weight: baseWeight, style: baseStyle })
  }
  return runs.length ? runs : [{ text: src, weight: baseWeight, style: baseStyle }]
}

export function plainStyledText(text) {
  return String(text ?? '').replace(/[\[\]{}]/g, '')
}
