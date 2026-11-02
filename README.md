<p align="center">
  <img src="https://www.useinstatools.com/logo-dark.png" alt="Instatools" height="48" />
</p>

Free Instagram posts in your browser. No AI. Canva alternative for Instagram posts.

Pick a layout, drop in your photo and headline, export an HD PNG on your device. No signup. Photos never leave the browser.

**Live site:** [useinstatools.com](https://www.useinstatools.com/)

## Run it locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://127.0.0.1:5173`).

| Command | What it does |
| --- | --- |
| `npm run dev` | Local app |
| `npm run build` | Production build into `dist/` |
| `npm run deploy:cf` | Build and deploy Cloudflare Pages |

## Layouts

News, sports, tweets, fashion, rap cutouts, campaign ads, and more. Each one is a real template you edit. There is no prompt box and no model.

## API

Email login. Copy a key from your account. Create a design, patch fields, render PNG. Buy Pro with that same email, even before you have a key. Free has a monthly cap. Pro raises it.

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

Docs: [useinstatools.com/docs](https://www.useinstatools.com/docs)  
Account: [useinstatools.com/account](https://www.useinstatools.com/account)  
Pricing: [useinstatools.com/pricing](https://www.useinstatools.com/pricing)

The renderer compiles the same Vue templates as the public site.

## Repo layout

```
src/          Site, editor, docs, pricing, account
api/          Cloudflare Worker
public/       Static files
```

## License

MIT. See [LICENSE](LICENSE).
