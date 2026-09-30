import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { freshJourney, saveAnswer } from '../src/journey.js';
import { discoveryView, discoveryRecord, discoveryControls } from '../src/discovery.js';
const source = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
function example(){let record=freshJourney();for(const [stage,value] of [['interest','Games'],['story','I planned a route, asked a teammate to scout, and changed the route after a failed attempt.'],['skills',['planning','coordination','adaptation']],['direction','Make a short guide for my team'],['reward','A calmer next match together'],['constraints','Ten minutes and a text-only format'],['action','Write down one route and a fallback']])record=saveAnswer(record,stage,value);return record;}

test('fresh surface has one required question and no personal measurement',()=>{
 const html=discoveryView(freshJourney());
 assert.match(html,/What has your attention lately/);
 assert.equal((html.match(/<textarea /g)||[]).length,1);
 assert.equal((html.match(/type="submit"/g)||[]).length,1);
 assert.doesNotMatch(html,/data-testid="index-value"|percentile|\/ 1000/);
 assert.match(html,/Guided prompts, no live AI/);
 assert.match(html,/Games/);assert.match(html,/Stories &amp; fandom/);assert.match(html,/Music/);
});
test('reported actions never become independently observed or transferred proficiency',()=>{
 const r=example();const html=discoveryRecord(r,'saved','');
 assert.match(html,/not an independent observation/);
 assert.match(html,/Proficiency has not been measured/);
 assert.match(html,/Transfer to another setting: untested/);
 assert.match(html,/Comparative standing: unknown/);
 assert.match(html,/Your concrete example/);
});
test('contradicted and uncertain outcomes stay explicit with no awarded score',()=>{
 for(const state of ['contradicts','uncertain']){
   const r=saveAnswer(example(),'reflection',{outcome:'The fallback did not help. We need another attempt.',evidenceStatus:state});
   const html=discoveryView(r);
   assert.match(html,/No score changed/);
   assert.match(html,state==='contradicts'?/A limit or contradiction worth keeping/:/Still uncertain/);
 }
});
test('all user-authored visible fields are escaped in presentation',()=>{
 const r=example();r.interest='<img src=x onerror=alert(1)>';r.nextStep='<script>alert(1)</script>';
 const html=discoveryView(r)+discoveryRecord(r,'saved','');
 assert.doesNotMatch(html,/<img src=x|<script>alert/);
 assert.match(html,/&lt;img src=x/);assert.match(html,/&lt;script&gt;/);
});
test('recovery inhibits ordinary submits and exposes original-data export',()=>{
 const html=discoveryView(freshJourney(),'interest','recovery','Keep original');
 assert.match(html,/type="submit" disabled/);
 assert.match(html,/journey-recovery/);
 assert.match(discoveryControls('recovery'),/Download original data/);
});
test('persistence failure remains a visible session-only warning',()=>{
 const html=discoveryView(example(),'ready','session','Quota exceeded');
 assert.match(html,/This visit is session-only/);assert.match(html,/Quota exceeded/);
 assert.match(html,/journey-export/);
});
test('new state module and view ship in both static and offline builds',()=>{
 const build=source('scripts/build.mjs');
 assert.match(build,/'participants', 'domain', 'journey', 'discovery', 'app'/);
 assert.match(build,/'styles', 'comparative', 'discovery'/);
 assert.match(source('index.html'),/src\/discovery.css/);
});
test('three primary destinations preserve every detailed demo route',()=>{
 const app=source('src/app.js');
 assert.match(app,/const primary=\[\['today','leaf','Today'\],\['record','book','Your record'\],\['board','chart','Explore demo'\]\]/);
 for(const route of ['people','projects','trajectory','perspectives','evidence','methodology','consent'])assert.match(app,new RegExp("\\['"+route+"'"));
 assert.match(app,/fictional measurements/);
 assert.match(app,/Your own record is separate/);
});
