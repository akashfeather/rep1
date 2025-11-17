#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const newsDir = path.join(repoRoot, 'news');

let timer = null;
function regenerate() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    console.log('Changes detected in news/, regenerating news index...');
    exec('node scripts/generate_news_index.js', { cwd: repoRoot }, (err, stdout, stderr) => {
      if (err) {
        console.error('Error running generator:', err);
        return;
      }
      if (stdout) process.stdout.write(stdout);
      if (stderr) process.stderr.write(stderr);
      console.log('Regeneration complete.');
    });
  }, 200);
}

try {
  // Start by running once
  console.log('Initial generation...');
  exec('node scripts/generate_news_index.js', { cwd: repoRoot }, (err, stdout, stderr) => {
    if (err) console.error(err);
    if (stdout) process.stdout.write(stdout);
    if (stderr) process.stderr.write(stderr);
    console.log('Initial generation finished. Watching for changes in', newsDir);
  });

  // Watch for changes in the news directory
  fs.watch(newsDir, { persistent: true }, (eventType, filename) => {
    if (!filename) return;
    // only trigger on HTML changes (add/remove/rename/change)
    if (/\.html$/i.test(filename)) {
      regenerate();
    }
  });
} catch (err) {
  console.error('Failed to watch news directory:', err.message);
  process.exit(1);
}
