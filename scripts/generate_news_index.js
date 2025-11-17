#!/usr/bin/env node
const fs = require('fs').promises;
const path = require('path');

async function extractMeta(html, name){
  const re = new RegExp(`<meta\\s+(?:name|property)=["']${name}["']\\s+content=["']([^"']+)["']`, 'i');
  const m = html.match(re);
  return m ? m[1].trim() : null;
}

async function extractTitle(html){
  // check og:title or <title> or first <h1>
  let m = html.match(/<meta\s+(?:property|name)=["']og:title["']\s+content=["']([^"']+)["']/i);
  if(m) return m[1].trim();
  m = html.match(/<title>([^<]+)<\/title>/i);
  if(m) return m[1].trim();
  m = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if(m) return m[1].trim();
  return null;
}

async function extractDescription(html){
  let m = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
  if(m) return m[1].trim();
  m = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
  if(m) return m[1].trim();
  // fallback to first paragraph
  m = html.match(/<p[^>]*>([^<]{30,}?)<\/p>/i);
  if(m) return m[1].trim();
  return null;
}

async function extractDate(html){
  let m = html.match(/<meta\s+name=["']date["']\s+content=["']([^"']+)["']/i);
  if(m) return m[1].trim();
  m = html.match(/<meta\s+property=["']article:published_time["']\s+content=["']([^"']+)["']/i);
  if(m) return m[1].trim();
  // fallback: look for <time datetime="...">
  m = html.match(/<time[^>]*datetime=["']([^"']+)["'][^>]*>/i);
  if(m) return m[1].trim();
  return null;
}

async function extractThumbnail(html){
  // look for background-image url(...) or <img src=>
  let m = html.match(/background-image\s*:\s*url\((?:'|")?([^'"\)]+)(?:'|")?\)/i);
  if(m) return m[1].trim();
  m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if(m) return m[1].trim();
  m = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
  if(m) return m[1].trim();
  return null;
}

async function main(){
  const repoRoot = path.resolve(__dirname, '..');
  const newsDir = path.join(repoRoot, 'news');
  const outJsonFile = path.join(newsDir, 'news-index.json');
  const outJsFile = path.join(repoRoot, 'news-data.js');

  // Map article filenames to their correct thumbnail images
  // Add your news files here with their thumbnail paths when you add new ones
  const thumbnailMap = {
    'news1.html': 'assets/motion design.png',
    'news 2.html': 'assets/Digital Marketing.png',
    'news 3.html': 'assets/app.png',
    'news 4.html': 'assets/app.png'
  };

  try{
    const files = await fs.readdir(newsDir);
    const htmlFiles = files.filter(f => f.endsWith('.html') && f.toLowerCase() !== 'template.html');
    const items = [];
    for(const file of htmlFiles){
      const p = path.join(newsDir, file);
      try{
        const content = await fs.readFile(p, 'utf8');
        const title = (await extractTitle(content)) || file.replace(/\.html$/i, '').replace(/news-?/i, '').replace(/-/g, ' ');
        const description = (await extractDescription(content)) || '';
        let date = await extractDate(content);
        if(!date){
          const st = await fs.stat(p);
          date = st.mtime.toISOString();
        }
        // Use hardcoded thumbnail mapping if available, otherwise extract from HTML
        let thumbnail = thumbnailMap[file] || (await extractThumbnail(content)) || '';
        // normalize thumbnail paths so they work from site root when consumed by news.html
        if(thumbnail){
          // Normalize thumbnail to a relative path (no leading slash) so it resolves correctly
          // when the site is deployed under a subpath (e.g. /rep1/).
          // Remove ../ or ./ prefixes and any leading '/'
          thumbnail = thumbnail.replace(/^\.\.\//, '');
          thumbnail = thumbnail.replace(/^\.\//, '');
          thumbnail = thumbnail.replace(/^\//, '');
          // URL-encode spaces and other characters so thumbnails work in URLs
          if(!/^https?:\/\//i.test(thumbnail)){
            thumbnail = encodeURI(thumbnail);
          }
        }
        // category: try meta name=category
        let category = null;
        const m = content.match(/<meta\s+name=["']category["']\s+content=["']([^"']+)["']/i);
        if(m) category = m[1].trim();

        items.push({
          filename: file,
          url: path.posix.join('news', file),
          title: title,
          description: description,
          date: date,
          thumbnail: thumbnail,
          category: category || ''
        });
      }catch(err){
        console.warn('skip', file, err.message);
      }
    }

    // sort by date desc
    items.sort((a,b)=> new Date(b.date) - new Date(a.date));

    // Write JSON file (for optional use with fetch)
    await fs.writeFile(outJsonFile, JSON.stringify(items, null, 2), 'utf8');
    
    // Write JavaScript file for direct inclusion in HTML (no CORS issues!)
    const jsContent = `// Auto-generated news data - DO NOT EDIT MANUALLY
// Run: node scripts/generate_news_index.js
const ARTICLES_DATA = ${JSON.stringify(items, null, 2)};
`;
    await fs.writeFile(outJsFile, jsContent, 'utf8');
    
    console.log(`✓ Wrote news index with ${items.length} items`);
    console.log(`  - JSON: ${outJsonFile}`);
    console.log(`  - JavaScript: ${outJsFile}`);
    console.log('');
    console.log('📰 News articles found:');
    items.forEach((item, i) => {
      console.log(`  ${i + 1}. ${item.title}`);
    });
  }catch(err){
    console.error('Error generating news index', err);
    process.exit(1);
  }
}

main();
