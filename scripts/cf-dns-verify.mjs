import { readFileSync } from 'node:fs'

const ACCOUNT = '58fc4587a33bb19f74e7250bde60023c'
const TOKEN_PATH = 'C:/Users/lifa2/.wrangler/config/default.toml'
const TXT = 'google-site-verification=bVxbDPvtscdlQ86pCfmJkjAnGFwyKaOQ_MdAyPiuq7A'

function oauthToken() {
  const toml = readFileSync(TOKEN_PATH, 'utf8')
  const match = toml.match(/oauth_token\s*=\s*"([^"]+)"/)
  if (!match) throw new Error('No Wrangler OAuth token found')
  return match[1]
}

async function cf(method, path, body) {
  const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${oauthToken()}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json()
  return { status: res.status, json }
}

function summary(result) {
  const slim = {
    status: result.status,
    success: result.json?.success,
    errors: result.json?.errors,
    count: result.json?.result_info?.count ?? (Array.isArray(result.json?.result) ? result.json.result.length : undefined),
    names: Array.isArray(result.json?.result)
      ? result.json.result.map((row) => row.name || row.id).slice(0, 50)
      : result.json?.result?.name || result.json?.result?.id,
  }
  return slim
}

const zonesExact = await cf('GET', '/zones?name=useinstatools.com')
console.log('zones name=useinstatools.com', JSON.stringify(summary(zonesExact), null, 2))

const zonesWww = await cf('GET', '/zones?name=www.useinstatools.com')
console.log('zones name=www.useinstatools.com', JSON.stringify(summary(zonesWww), null, 2))

const zonesAll = await cf('GET', `/zones?account.id=${ACCOUNT}&per_page=50`)
console.log('all zones', JSON.stringify(summary(zonesAll), null, 2))

let zone = zonesExact.json?.result?.[0] || zonesAll.json?.result?.find((z) => String(z.name).includes('useinstatools'))
if (!zone) {
  console.log('Creating Cloudflare zone for useinstatools.com...')
  const createdZone = await cf('POST', '/zones', {
    name: 'useinstatools.com',
    account: { id: ACCOUNT },
    type: 'full',
  })
  console.log('create zone', JSON.stringify({
    status: createdZone.status,
    success: createdZone.json?.success,
    errors: createdZone.json?.errors,
    id: createdZone.json?.result?.id,
    name: createdZone.json?.result?.name,
    statusName: createdZone.json?.result?.status,
    nameServers: createdZone.json?.result?.name_servers,
  }, null, 2))
  if (!createdZone.json?.success) process.exit(2)
  zone = createdZone.json.result
}

console.log('using zone', zone.name, zone.id)

const existing = await cf('GET', `/zones/${zone.id}/dns_records?type=TXT&per_page=100`)
const records = Array.isArray(existing.json?.result) ? existing.json.result : []
const already = records.find((row) => String(row.content).includes('google-site-verification=bVxbDPvtscdlQ86pCfmJkjAnGFwyKaOQ_MdAyPiuq7A'))
console.log('existing TXT count', records.length, already ? 'verification already present' : 'verification missing')

if (!already) {
  const created = await cf('POST', `/zones/${zone.id}/dns_records`, {
    type: 'TXT',
    name: zone.name,
    content: TXT,
    ttl: 3600,
    comment: 'Google Search Console verification',
  })
  console.log('create TXT', JSON.stringify({
    status: created.status,
    success: created.json?.success,
    errors: created.json?.errors,
    id: created.json?.result?.id,
    name: created.json?.result?.name,
    type: created.json?.result?.type,
  }, null, 2))
  if (!created.json?.success) process.exit(1)
} else {
  console.log('TXT already exists', already.id, already.name)
}
