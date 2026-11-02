import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ACCOUNT = '58fc4587a33bb19f74e7250bde60023c'
const PROJECT = 'instatools'
const TOKEN_PATH = 'C:/Users/lifa2/.wrangler/config/default.toml'
const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function oauthToken() {
  const toml = readFileSync(TOKEN_PATH, 'utf8')
  const match = toml.match(/oauth_token\s*=\s*"([^"]+)"/)
  if (!match) throw new Error('No Wrangler OAuth token found')
  return match[1]
}

const res = await fetch(
  `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/pages/projects/${PROJECT}`,
  { headers: { Authorization: `Bearer ${oauthToken()}` } },
)
const json = await res.json()
if (!json.success) {
  console.error('Could not read Pages project')
  process.exit(1)
}

const tag = json.result?.build_config?.web_analytics_tag || ''
const token = json.result?.build_config?.web_analytics_token || ''
if (!token) {
  console.error('Pages project has no web_analytics_token. Enable Metrics > Web Analytics in the dashboard, then rerun.')
  process.exit(1)
}

const file = join(root, 'src', 'seo', 'analytics.js')
writeFileSync(
  file,
  `export const WEB_ANALYTICS = {
  tag: ${JSON.stringify(tag)},
  token: ${JSON.stringify(token)},
  src: 'https://static.cloudflareinsights.com/beacon.min.js',
}

export function analyticsSnippet() {
  if (!WEB_ANALYTICS.token) return ''
  const beacon = JSON.stringify({ token: WEB_ANALYTICS.token, spa: true })
  return \`<script defer src="\${WEB_ANALYTICS.src}" data-cf-beacon='\${beacon}'></script>\`
}
`,
)

console.log(`Wrote Cloudflare Web Analytics beacon (${tag})`)
