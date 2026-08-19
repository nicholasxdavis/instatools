import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  INDEXABLE_PAGES,
  NOT_FOUND_PAGE,
  headTagsForPage,
  noscriptForPage,
  robotsTxt,
  sitemapXml,
} from '../src/seo/catalog.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')

function inject(html, page) {
  let next = html.replace(
    /<!--seo:start-->[\s\S]*?<!--seo:end-->/,
    `<!--seo:start-->\n${headTagsForPage(page)}\n    <!--seo:end-->`,
  )
  next = next.replace(/<noscript>[\s\S]*?<\/noscript>/, noscriptForPage(page))
  return next
}

function fileForPath(path) {
  if (path === '/') return join(dist, 'index.html')
  return join(dist, path.replace(/^\//, '').replace(/\/$/, ''), 'index.html')
}

const source = await readFile(join(dist, 'index.html'), 'utf8')
const pages = [...INDEXABLE_PAGES, NOT_FOUND_PAGE]

for (const page of pages) {
  const file = fileForPath(page.path)
  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, inject(source, page))
  console.log(`seo ${page.path} -> ${file.slice(root.length + 1)}`)
}

await writeFile(join(dist, 'sitemap.xml'), sitemapXml())
await writeFile(join(dist, 'robots.txt'), robotsTxt())

// GitHub Pages serves /404.html for missing paths.
const notFoundHtml = inject(source, NOT_FOUND_PAGE)
await writeFile(join(dist, '404.html'), notFoundHtml)
console.log('wrote sitemap.xml, robots.txt, and 404.html')
