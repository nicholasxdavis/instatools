import { readFileSync, writeFileSync } from 'node:fs'
import { HOME_PAGE, THEME_PAGES, headTagsForPage, noscriptForPage } from '../src/seo/catalog.js'

let html = readFileSync('index.html', 'utf8')
html = html.replace(
  /<!--seo:start-->[\s\S]*?<!--seo:end-->/,
  `<!--seo:start-->\n${headTagsForPage(HOME_PAGE)}\n    <!--seo:end-->`,
)
html = html.replace(/<noscript>[\s\S]*?<\/noscript>/, noscriptForPage(HOME_PAGE))
writeFileSync('index.html', html)

let man = readFileSync('public/site.webmanifest', 'utf8')
const manifest = JSON.parse(man)
manifest.description = 'Free Instagram post maker with ready-to-edit layouts and local HD export.'
writeFileSync('public/site.webmanifest', `${JSON.stringify(manifest, null, 2)}\n`)

console.log('synced index.html + manifest')
for (const page of [HOME_PAGE, ...THEME_PAGES]) {
  console.log(
    page.path,
    't',
    page.title.length,
    'd',
    page.description.length,
    page.title,
  )
}
