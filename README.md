<p align="center">
  <img src="public/logo-dark.png" alt="Instatools" height="56" />
</p>

# Instatools

Free Instagram post maker. No AI.

Pick a layout, drop in your photo and headline, export an HD PNG on your device. No signup. Photos never leave the browser.

**Live site:** [useinstatools.com](https://www.useinstatools.com/)

<p align="center">
  <img src="public/og.png" alt="Instatools homepage" />
</p>

<p align="center">
  <img src="public/themes/cards/template1.png" alt="News Classic layout" width="46%" />
  <img src="public/themes/cards/template16.png" alt="Launch layout" width="46%" />
</p>

## Run the maker

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://127.0.0.1:5173`).

| Command | What it does |
| --- | --- |
| `npm run dev` | Local maker |
| `npm run build` | Production build into `dist/` |
| `npm run deploy:cf` | Build and deploy Cloudflare Pages |

## Layouts

News, sports, tweets, fashion, rap cutouts, campaign ads, and more. Each one is a real template you edit. There is no prompt box and no model.

## API

Email signup. We send a key. Create a design, patch fields, render PNG. Free has a monthly cap. Pro raises it.

```bash
cd api
npm install
cp .dev.vars.example .dev.vars
npm run dev
```

API: `http://127.0.0.1:8787`

```bash
curl http://127.0.0.1:8787/v1/templates \
  -H "Authorization: Bearer itk_dev_local_testing_key"
```

Docs: [useinstatools.com/docs](https://www.useinstatools.com/docs/)  
Get a key: [useinstatools.com/signup](https://www.useinstatools.com/signup/)  
Pricing: [useinstatools.com/docs/#/pricing](https://www.useinstatools.com/docs/#/pricing)

The renderer compiles the same Vue templates as the public maker.

## Repo layout

```
src/          Maker and marketing site
docs/         API docs (served at /docs/)
api/          Cloudflare Worker
public/       Static files
```

## License

MIT. See [LICENSE](LICENSE).
