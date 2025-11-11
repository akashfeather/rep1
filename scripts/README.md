# News scripts

This folder contains small helper scripts to manage the `news/` directory.

Available:

- `generate_news_index.js` — Node script that scans the `news/` folder for `.html` files (excluding `template.html`) and writes `news/news-index.json` with metadata (title, date, description, thumbnail, url).

How to run:

1. From the project root run (requires Node.js installed):

```powershell
node scripts/generate_news_index.js
```

2. Open the site with a local HTTP server (e.g. `npx serve` or `python -m http.server`) so `news/news-index.json` can be fetched by `news.html`.

Notes:

- The script extracts metadata from meta tags (`description`, `date`, `og:title`, `og:description`, `og:image`) where present and falls back to filesystem timestamps and the first paragraph.
- If you add or remove a file in `news/`, re-run the script to update `news/news-index.json`.
