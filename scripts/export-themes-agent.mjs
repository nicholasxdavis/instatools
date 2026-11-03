/**
 * Dump every theme (free + Pro) into one agent-friendly JSON.
 * Output: ../../.development/.themes/all-themes.json
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, '..', '.development', '.themes')
const outFile = join(outDir, 'all-themes.json')

const LAYOUT = {
  template1: {
    pattern: 'full-bleed-photo-overlay',
    summary: 'Full-bleed photo with giant multi-line headline + caption overlay. Accent markup via [brackets] and {braces}.',
    shared: ['CoverImage', 'HeadlineMarkup', 'WatermarkLayer'],
    markup: 'brackets-braces',
  },
  template2: {
    pattern: 'photo-with-headline-bar',
    summary: 'Clean interview / media look. Photo with a headline bar and optional watermark.',
    shared: ['CoverImage', 'WatermarkLayer'],
    markup: 'plain',
  },
  template3: {
    pattern: 'split-photo-type',
    summary: 'Wealth/finance split: photo column + bold headline column.',
    shared: ['CoverImage', 'WatermarkLayer'],
    markup: 'plain',
  },
  template4: {
    pattern: 'magazine-cover-xxl',
    summary: 'Magazine cover energy with oversized XXL type over a photo.',
    shared: ['CoverImage', 'WatermarkLayer'],
    markup: 'plain',
  },
  template5: {
    pattern: 'dual-image-compare',
    summary: 'Two photos side by side with a stacked headline for compare posts.',
    shared: ['CoverImage', 'WatermarkLayer'],
    markup: 'plain',
  },
  template6: {
    pattern: 'sports-action-type',
    summary: 'Sports news graphic. Shares Preview with template8 via variant prop t6.',
    shared: ['CoverImage', 'WatermarkLayer'],
    markup: 'plain',
    sharesPreviewWith: 'template8',
    previewVariant: 't6',
  },
  template7: {
    pattern: 'tweet-card-square',
    summary: 'Square 1080x1080 tweet/X card with avatar, handle, body, and icons.',
    shared: [],
    markup: 'plain',
    square: true,
  },
  template8: {
    pattern: 'sports-action-type',
    summary: 'Sports alt graphic. Reuses template6 Preview with variant t8.',
    shared: ['CoverImage', 'WatermarkLayer'],
    markup: 'plain',
    sharesPreviewWith: 'template6',
    previewVariant: 't8',
  },
  template9: {
    pattern: 'local-business-hero',
    summary: 'Local spot / venue photo with bold headline treatment.',
    shared: ['CoverImage', 'WatermarkLayer'],
    markup: 'plain',
  },
  template10: {
    pattern: 'grunge-poster',
    summary: 'Distressed music/poster print look with grunge type and overlays.',
    shared: ['CoverImage', 'WatermarkLayer'],
    markup: 'plain',
  },
  template11: {
    pattern: 'editorial-fashion',
    summary: 'Fashion editorial with serif type over photography.',
    shared: ['CoverImage', 'WatermarkLayer'],
    markup: 'plain',
  },
  template12: {
    pattern: 'cutout-stack',
    summary: 'Pro. Transparent PNG cutouts stacked/arranged (rappers, products). Uses CutoutStackPreview.',
    shared: ['CutoutStackPreview', 'WatermarkLayer'],
    markup: 'plain',
    pro: true,
  },
  template13: {
    pattern: 'live-alert-rail',
    summary: 'Breaking/live alert with signal rail and huge type.',
    shared: ['CoverImage', 'WatermarkLayer'],
    markup: 'plain',
  },
  template14: {
    pattern: 'hazard-stripes-bottom-type',
    summary: 'Sports hazard stripes with bottom-weighted type.',
    shared: ['CoverImage', 'WatermarkLayer'],
    markup: 'plain',
  },
  template15: {
    pattern: 'campaign-photo-cutout',
    summary: 'Campaign layout: photo field, clean type, optional framed cutout.',
    shared: ['CoverImage', 'WatermarkLayer'],
    markup: 'plain',
  },
  template16: {
    pattern: 'saas-product-ad',
    summary: 'Pro. SaaS/product ad with logo, CTA, and product shot.',
    shared: ['CoverImage', 'WatermarkLayer'],
    markup: 'plain',
    pro: true,
  },
  template17: {
    pattern: 'smoke-cutout-stage',
    summary: 'Pro. Rapper/product PNG cutouts on a red smoke/glow stage.',
    shared: ['CoverImage', 'WatermarkLayer'],
    markup: 'plain',
    pro: true,
  },
  template18: {
    pattern: 'award-week-stack',
    summary: 'Photo-first award week: right-side wash, oval badge, stacked PLAYER OF THE WEEK, matchup, stars.',
    shared: ['CoverImage', 'HeadlineMarkup', 'WatermarkLayer'],
    markup: 'brackets',
  },
  template19: {
    pattern: 'breaking-slash-banner',
    summary: 'Photo-first breaking: slash BREAKING NEWS banner, byline, and body over a bottom photo fade.',
    shared: ['CoverImage', 'WatermarkLayer'],
    markup: 'plain',
  },
  template20: {
    pattern: 'scoreline-glass-bar',
    summary: 'Photo-first scoreline: glass full-time bar, teams/scores/scorer over action photo + bottom fade.',
    shared: ['CoverImage', 'WatermarkLayer', 'PaginationDots'],
    markup: 'plain',
  },
  template21: {
    pattern: 'impact-mid-headline',
    summary: 'Photo-first impact: giant mid-frame condensed headline, bottom caption, bottom fade, carousel dots.',
    shared: ['CoverImage', 'HeadlineMarkup', 'WatermarkLayer', 'PaginationDots'],
    markup: 'brackets',
  },
  template22: {
    pattern: 'trending-banner-wash',
    summary: 'Photo-first trending: team-color bottom wash, optional center mark, bold TRENDING banner.',
    shared: ['CoverImage', 'HeadlineMarkup', 'WatermarkLayer'],
    markup: 'brackets',
  },
}

const HOW_TO_ADD = {
  overview:
    'A theme is not one file. Wire SEO catalog + fields + defaults + Preview.vue + themes/index.js registry + export/engine.js renderer, then regenerate catalogs.',
  steps: [
    {
      step: 1,
      file: 'instatools-v2/src/seo/catalog.js',
      do: 'Add THEME_CATALOG entry: id (templateN), slug, name, title, h1, description, keywords, optional pro: true.',
    },
    {
      step: 2,
      file: 'instatools-v2/src/themes/fields.js',
      do: 'Add THEME_FIELDS.templateN as grouped editor controls. Paths use post.style for template1, else post.tN.*',
    },
    {
      step: 3,
      file: 'instatools-v2/src/themes/defaults.js',
      do: 'Add default slice under style (template1) or tN. Match field paths.',
    },
    {
      step: 4,
      file: 'instatools-v2/src/themes/templateN/Preview.vue',
      do: 'Build live canvas preview. Prefer shared/CoverImage, HeadlineMarkup, WatermarkLayer, CutoutStackPreview when relevant.',
    },
    {
      step: 5,
      file: 'instatools-v2/src/themes/index.js',
      do: 'Import Preview, register in PREVIEWS with fields + note (+ square/props if needed).',
    },
    {
      step: 6,
      file: 'instatools-v2/src/export/engine.js',
      do: 'Add matching Canvas2D export path so PNG matches Preview 1:1.',
    },
    {
      step: 7,
      file: 'instatools-v2/src/themes/cards.js + public theme thumbs',
      do: 'Add marketing card entry and preview/card images under public/themes.',
    },
    {
      step: 8,
      file: 'instatools-v2/api/scripts/export-catalog.mjs',
      do: 'Add NOTES[+ SQUARE if 1080x1080], then npm run catalog in api/. Also re-run this agent export.',
    },
  ],
  conventions: {
    canvas: 'Default 1080x1350. Only template7 is square 1080x1080.',
    stateKey: 'template1 uses style (+ top-level headline/caption/bgImage). templateN uses tN.',
    markup: '[word] and {word} accent colors via HeadlineMarkup where enabled.',
    images: 'Prefer CDN URLs under cdnOrigin or data URIs. Browser editor keeps user photos local.',
    pro: 'Set pro:true on THEME_CATALOG and gate export/API with assertTemplatePlan / isProTheme.',
    sharedPreviews: 'template6 and template8 share one Preview with a variant prop.',
  },
  sourceMap: {
    seoCatalog: 'instatools-v2/src/seo/catalog.js',
    fields: 'instatools-v2/src/themes/fields.js',
    defaults: 'instatools-v2/src/themes/defaults.js',
    registry: 'instatools-v2/src/themes/index.js',
    cards: 'instatools-v2/src/themes/cards.js',
    exportEngine: 'instatools-v2/src/export/engine.js',
    designIo: 'instatools-v2/src/utils/design-io.js',
    apiCatalog: 'instatools-v2/api/src/catalog.json',
    previewDir: 'instatools-v2/src/themes/templateN/Preview.vue',
    sharedDir: 'instatools-v2/src/themes/shared/',
  },
}

const server = await createServer({
  configFile: join(root, 'vite.config.js'),
  root,
  server: { middlewareMode: true },
  appType: 'custom',
})

try {
  // Ensure API catalog is fresh first.
  const { spawnSync } = await import('node:child_process')
  const catalogRun = spawnSync('npm', ['run', 'catalog'], {
    cwd: join(root, 'api'),
    shell: true,
    encoding: 'utf8',
  })
  if (catalogRun.status !== 0) {
    console.error(catalogRun.stdout || '')
    console.error(catalogRun.stderr || '')
    throw new Error('api catalog export failed')
  }

  const apiCatalog = JSON.parse(await readFile(join(root, 'api', 'src', 'catalog.json'), 'utf8'))
  const { THEME_CATALOG } = await server.ssrLoadModule('/src/seo/catalog.js')
  const { THEME_FIELDS } = await server.ssrLoadModule('/src/themes/fields.js')

  const templates = apiCatalog.templates.map((tpl) => {
    const seo = THEME_CATALOG.find((t) => t.id === tpl.id) || {}
    const layout = LAYOUT[tpl.id] || { pattern: 'unknown', summary: tpl.note, shared: [], markup: 'plain' }
    const fieldGroups = (THEME_FIELDS[tpl.id] || []).map((group) => ({
      title: group.title,
      fieldCount: (group.fields || []).length,
      fields: (group.fields || []).map((f) => ({
        type: f.type,
        path: f.path,
        label: f.label,
        hint: f.hint,
        min: f.min,
        max: f.max,
        step: f.step,
        unit: f.unit,
        rows: f.rows,
        togglePath: f.togglePath,
        customPath: f.customPath,
        options: f.options,
        fonts: f.fonts,
        controls: f.controls
          ? f.controls.map((c) => ({
              type: c.type,
              path: c.path,
              label: c.label,
              min: c.min,
              max: c.max,
              step: c.step,
              unit: c.unit,
              togglePath: c.togglePath,
              customPath: c.customPath,
              options: c.options,
              fonts: c.fonts,
            }))
          : undefined,
      })),
    }))

    return {
      ...tpl,
      seo: {
        title: seo.title,
        h1: seo.h1,
        keywords: seo.keywords,
      },
      layout,
      source: {
        preview: `instatools-v2/src/themes/${tpl.id}/Preview.vue`,
        // template8 reuses template6 Preview
        previewActual:
          layout.sharesPreviewWith === 'template6'
            ? 'instatools-v2/src/themes/template6/Preview.vue'
            : `instatools-v2/src/themes/${tpl.id}/Preview.vue`,
        fieldsKey: `THEME_FIELDS.${tpl.id}`,
        defaultsKey: tpl.stateKey === 'style' ? 'post.style (+ headline/caption/bgImage)' : `post.${tpl.stateKey}`,
        exportHint: `instatools-v2/src/export/engine.js branch for ${tpl.id}`,
      },
      fieldGroups,
    }
  })

  const free = templates.filter((t) => !t.pro)
  const pro = templates.filter((t) => t.pro)

  const dump = {
    version: 2,
    generatedAt: new Date().toISOString(),
    purpose:
      'Agent reference: every Instatools theme (free + Pro), how state/fields/defaults work, and how to add more.',
    product: {
      name: 'Instatools',
      site: 'https://www.useinstatools.com/',
      editor: 'https://www.useinstatools.com/make/',
      api: 'https://instatools-api.nic-58f.workers.dev',
      github: 'https://github.com/nicholasxdavis/instatools',
    },
    counts: {
      total: templates.length,
      free: free.length,
      pro: pro.length,
    },
    canvas: apiCatalog.canvas,
    cdnOrigin: apiCatalog.cdnOrigin,
    fonts: apiCatalog.fonts,
    colors: apiCatalog.colors,
    howToAddTheme: HOW_TO_ADD,
    index: templates.map((t) => ({
      id: t.id,
      slug: t.slug,
      name: t.name,
      pro: t.pro,
      square: t.square,
      stateKey: t.stateKey,
      pattern: t.layout.pattern,
      note: t.note,
    })),
    templates,
  }

  await mkdir(outDir, { recursive: true })
  await writeFile(outFile, `${JSON.stringify(dump, null, 2)}\n`, 'utf8')
  console.log(`Wrote ${templates.length} themes (${free.length} free / ${pro.length} pro) -> ${outFile}`)
} finally {
  await server.close()
}
