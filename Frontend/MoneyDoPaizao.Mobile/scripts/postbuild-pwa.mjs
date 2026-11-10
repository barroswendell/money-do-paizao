import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const indexPath = fileURLToPath(new URL('../dist/index.html', import.meta.url));
let html = readFileSync(indexPath, 'utf8');

const headTags = `
<link rel="manifest" href="/manifest.json">
<link rel="apple-touch-icon" href="/icon.svg">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Paizão">`;

if (!html.includes('rel="manifest"')) {
  html = html.replace('</head>', `${headTags}\n</head>`);
}

writeFileSync(indexPath, html);
