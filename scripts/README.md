# News scripts

This folder contains helper scripts to manage the `news/` directory.

## `generate_news_index.js`

Node script that scans the `news/` folder for `.html` files (excluding `template.html`) and writes `news/news-index.json` with metadata (title, date, description, thumbnail, url).

### How to use

**Whenever you add a new news article:**

1. Create your new `.html` file in the `news/` folder
2. From the project root, run:

```powershell
node scripts/generate_news_index.js
```

3. The script will automatically:
   - Find all `.html` files in the `news/` folder
   - Extract title, description, date, and thumbnail from meta tags
   - Generate `news/news-index.json`
   - Display all found articles

**The `news.html` page will automatically display all articles from the index.**

### Adding thumbnails for new articles

To ensure your new article shows with the correct thumbnail:

1. Add an entry to the `thumbnailMap` in `generate_news_index.js`:

```javascript
const thumbnailMap = {
    'news1.html': 'assets/motion design.png',
    'news 2.html': 'assets/Digital Marketing.png',
    'news 3.html': 'assets/app.png',
    'news 4.html': 'assets/app.png',
    'your-article.html': 'assets/your-thumbnail.png'  // Add your file here
};
```

2. Run the script again:

```powershell
node scripts/generate_news_index.js
```

### How it works

- Extracts metadata from meta tags: `og:title`, `og:description`, `og:image`, `article:published_time`, or `date`
- Falls back to `<title>`, first `<p>`, `<img>`, or file modification time if meta tags are missing
- Sorts articles by date (newest first)
- Normalizes paths so thumbnails work correctly
- The script is idempotent — run it multiple times without issues

### Notes

- Requires **Node.js** installed on your machine
 - Requires **Node.js** installed on your machine
 - Recommended: use the watcher to regenerate automatically when you add/remove/edit files

## Recommended: automatic regeneration while developing

To avoid running the generator manually each time you add a file, run the watcher. It regenerates the index whenever `.html` files in `news/` change:

```powershell
npm run watch-news
```

This runs `scripts/watch_news.js`, which runs the generator once immediately and then watches for changes.

If you prefer a one-off generation, run:

```powershell
npm run generate-news
```
