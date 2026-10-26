import { INDEXNOW, indexNowKeyLocation } from '../src/seo/indexnow.js'
import { indexableUrls } from '../src/seo/catalog.js'
import { SITE, absoluteUrl } from '../src/seo/site.js'

const payload = {
  host: INDEXNOW.host,
  key: INDEXNOW.key,
  keyLocation: indexNowKeyLocation(),
  urlList: indexableUrls(),
}

const endpoints = [
  'https://api.indexnow.org/indexnow',
  'https://www.bing.com/indexnow',
  'https://yandex.com/indexnow',
]

async function postJson(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  console.log(`IndexNow ${url} -> ${res.status} ${text.slice(0, 200)}`)
  return res.ok || res.status === 202
}

async function pingSitemap(url) {
  const res = await fetch(url, { method: 'GET', redirect: 'follow' })
  console.log(`Sitemap ping ${url} -> ${res.status}`)
}

let ok = 0
for (const endpoint of endpoints) {
  try {
    if (await postJson(endpoint, payload)) ok += 1
  } catch (error) {
    console.warn(`IndexNow ${endpoint} failed: ${error.message}`)
  }
}

const sitemap = absoluteUrl('/sitemap.xml')
try {
  await pingSitemap(`https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemap)}`)
} catch (error) {
  console.warn(`Bing sitemap ping failed: ${error.message}`)
}

console.log(`Submitted ${payload.urlList.length} URLs for ${SITE.origin}. ${ok}/${endpoints.length} IndexNow hosts accepted.`)
if (ok === 0) process.exitCode = 1
