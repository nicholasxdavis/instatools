export const WEB_ANALYTICS = {
  tag: "cd3d7866e498452fa69f2dda52609b7a",
  token: "f0f4c9447ad546d1bb2ac3356d3ae9d8",
  src: 'https://static.cloudflareinsights.com/beacon.min.js',
}

export function analyticsSnippet() {
  if (!WEB_ANALYTICS.token) return ''
  const beacon = JSON.stringify({ token: WEB_ANALYTICS.token, spa: true })
  return `<script defer src="${WEB_ANALYTICS.src}" data-cf-beacon='${beacon}'></script>`
}
