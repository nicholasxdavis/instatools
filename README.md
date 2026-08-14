# Instatools

Free Instagram post maker in your browser. Pick a layout, edit the photo and headline, export HD PNG locally. No signup.

**Live:** [www.useinstatools.com](https://www.useinstatools.com)

**CDN:** [nicholasxdavis/instatools-cdn](https://github.com/nicholasxdavis/instatools-cdn)

## Features

- 14 ready-to-edit Instagram layouts (news, sports, finance, tweets, fashion, and more)
- Vue 3 editor with live canvas preview
- Native Canvas 2D export (pixel-perfect, local-only)
- Presets you can save and import as JSON
- Marketing homepage + deep links per layout for SEO

## Stack

- Vue 3 + Vite + Pinia + Vue Router
- Catalog-driven SEO with prerendered theme routes
- Demo media served from the public CDN in production

## Develop

```bash
npm install
npm run dev
```

App: `http://127.0.0.1:5173`  
Maker: `http://127.0.0.1:5173/app`

Local defaults load from `/public/holder`. Production builds load demo photos from jsDelivr:

```text
https://cdn.jsdelivr.net/gh/nicholasxdavis/instatools-cdn@master/src/holder/
```

## Build

```bash
npm run build
```

Output is `dist/` (Vite build + SEO prerender).

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Local Vite server |
| `npm run build` | Production build + prerender |
| `npm run seo` | Build, Playwright SEO tests, Lighthouse |
| `npm run thumbs` | Regenerate WebP layout cards |

## License

MIT
