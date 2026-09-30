/** Dependency-free static build and portable, network-free HTML distribution. */
import { cp, mkdir, rm, readFile, readdir, writeFile } from 'node:fs/promises';
await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
for (const path of ['index.html', 'src', 'public', 'docs', 'licenses', 'LICENSE']) {
  await cp(path, `dist/${path}`, { recursive: true });
}
const html = await readFile('index.html', 'utf8');
const css = (await Promise.all(['styles', 'comparative', 'discovery'].map(name => readFile(`src/${name}.css`, 'utf8')))).join('\n');
const mark = 'data:image/svg+xml,' + encodeURIComponent(await readFile('public/mark.svg', 'utf8'));
const docs = Object.fromEntries(await Promise.all((await readdir('docs')).filter(f => f.endsWith('.md')).map(async f => [f, await readFile(`docs/${f}`, 'utf8')])));
docs['LICENSE'] = await readFile('LICENSE', 'utf8');
docs['MIT-legacy.txt'] = await readFile('licenses/MIT-legacy.txt', 'utf8');
// Source imports/exports are deliberately single-line. This is not a general JS bundler.
const modules = await Promise.all(['participants', 'domain', 'journey', 'discovery', 'app'].map(async name => {
  const source = await readFile(`src/${name}.js`, 'utf8');
  return source.replace(/^import .*\n/gm, '').replace(/^export \{[^\n]+\};?\n/gm, '').replace(/^export /gm, '').replaceAll('./public/mark.svg', mark);
}));
const bundled = `window.BECOMING_DOCS=${JSON.stringify(docs).replaceAll('<', '\\u003c')};\n${modules.join('\n')}`;
if (/^import\s|^export\s/m.test(bundled)) throw new Error('Unresolved module boundary in portable build.');
const offline = html
  .replace('<link rel="stylesheet" href="./src/styles.css">', `<style>${css}</style>`)
  .replace(/\s*<link rel="stylesheet" href="\.\/src\/comparative.css">/, '')
  .replace(/\s*<link rel="stylesheet" href="\.\/src\/discovery.css">/, '')
  .replace('./public/mark.svg', mark)
  .replace('<script type="module" src="./src/app.js"></script>', `<script type="module">${bundled.replaceAll('</script', '<\\/script')}</script>`);
await writeFile('dist/becoming.html', offline);
console.log('Built modular site and offline single-file product → dist/. No runtime dependencies or network calls.');
