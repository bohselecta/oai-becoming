import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
const text = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const blob = path => { const b=Buffer.from(text(path)); return createHash('sha1').update(`blob ${b.length}\0`).update(b).digest('hex'); };

test('new grant names the exact eligible OpenAI entities and excludes mere subscribers',()=>{
  const license=text('LICENSE');
  assert.match(license,/^Becoming OpenAI-Only License 1\.0/);
  assert.match(license,/OpenAI Foundation and OpenAI Group PBC/);
  assert.match(license,/subscribers, and independent\ndevelopers do not qualify/);
  assert.match(license,/royalty-free/);
  assert.match(license,/Any broader sublicense or transfer requires Licensor's written permission/);
});
test('license explicitly preserves the historical MIT grant and separate rights',()=>{
  const license=text('LICENSE');
  assert.match(license,/does not revoke or narrow the MIT permissions/);
  assert.match(license,/including unchanged portions retained in later releases/);
  assert.match(license,/GitHub's terms for public/);
  assert.match(license,/Licensor retains ownership/);
});
test('original MIT notice is preserved byte for byte, not repurposed as the new grant',()=>{
  assert.equal(blob('licenses/MIT-legacy.txt'),'e06ed74131754b076fcb815f90d10a505d4014ca');
  assert.notEqual(text('licenses/MIT-legacy.txt'),text('LICENSE'));
  assert.match(text('docs/LICENSE-HISTORY.md'),/08b970442f1dce36b7456c75c425f180ee2ecd67/);
});
test('package labels its custom license correctly and prevents accidental registry publication',()=>{
  const pkg=JSON.parse(text('package.json'));
  assert.equal(pkg.license,'SEE LICENSE IN LICENSE');
  assert.equal(pkg.version,'0.3.0'); // Interest-led product revision; license invariants are unchanged.
  assert.equal(pkg.private,true);
});
test('current offering no longer promises general MIT or unrestricted public reuse',()=>{
  for(const p of ['README.md','docs/PERMISSION.md','docs/PROPOSAL.md','CONTRIBUTING.md']){
    const content=text(p);
    assert.doesNotMatch(content,/under the repository's MIT License|OpenAI and anyone else|OpenAI and any other recipient|license-MIT-/);
    assert.match(content,/OpenAI.only/i);
  }
});
test('primary product name remains Becoming; ecosystem description states independence',()=>{
  const html=text('index.html');
  assert.match(html,/<title>Becoming · Know your place\. Change it\.<\/title>/);
  assert.match(html,/An independent concept for the OpenAI ecosystem/);
  assert.doesNotMatch(html,/<title>[^<]*(?:OpenAI Becoming|ChatGPT Becoming|GPT-\d)/);
  const app=text('src/app.js');
  assert.match(app,/class="brand-author">by Hayden Lindley/);
  assert.match(app,/An independent concept for the <span>OpenAI ecosystem\./);
  assert.match(app,/No OpenAI affiliation/);
});
test('original Becoming mark is retained and no official logo or font reference enters the app',()=>{
  assert.equal(blob('public/mark.svg'),'bddbd5ab256249e4ad626891cbf653e622b0a284');
  for(const p of ['index.html','src/app.js','src/comparative.css']){
    assert.doesNotMatch(text(p),/cdn\.openai\.com|OpenAI Sans|openai-logo|chatgpt-logo|blossom\.svg|fonts\.googleapis/);
  }
});
test('branding patch leaves measurement code, participants, base styles and prior assertions untouched',()=>{
  for(const [p,sha] of Object.entries({
    'src/domain.js':'06b2a89fddea279c5186df665abfeb5cfc255c3e',
    'src/participants.js':'b830d4784c1c2da3fe8b4dc8178c74e32eeae181',
    'src/styles.css':'48680b788aa9213ab320702e31306237aa096a77',
    'tests/domain.test.mjs':'1555aba2a0320bf7945f26593d9628017cfb2766',
    'tests/comparative.test.mjs':'556e70d19bd422195ad06cc108ca10781f4e944a',
  })) assert.equal(blob(p),sha,p);
});
test('both complete legal notices are included in the build and the offline downloader',()=>{
  const build=text('scripts/build.mjs');
  assert.match(build,/'licenses', 'LICENSE'/);
  assert.match(build,/docs\['LICENSE'\] = await readFile\('LICENSE'/);
  assert.match(build,/docs\['MIT-legacy\.txt'\] = await readFile\('licenses\/MIT-legacy\.txt'/);
  assert.match(text('src/app.js'),/a\[href="\.\/LICENSE"\],a\[href="\.\/licenses\/MIT-legacy\.txt"\]/);
});
test('license scope and brand source records ship beside the code',()=>{
  for(const p of ['docs/BRAND.md','docs/LICENSE-HISTORY.md','docs/PERMISSION.md','docs/STATUS.md']) assert.ok(existsSync(new URL(`../${p}`,import.meta.url)),p);
  assert.match(text('docs/BRAND.md'),/https:\/\/openai\.com\/brand\//);
  assert.match(text('docs/BRAND.md'),/No brand permission has been requested or obtained/);
  assert.match(text('docs/PERMISSION.md'),/not.*general.*open source/);
});
