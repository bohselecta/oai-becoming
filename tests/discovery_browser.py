"""Chromium acceptance for the actual interest-led Becoming builds.

Default: load dist/becoming.html with set_content. A test-document-only Storage
shim gives the opaque origin deterministic storage and fault scenarios. This
does NOT prove browser-origin persistence. --url runs the main journey against
the served modular build with real localStorage and a real browser reload; the
fault fixtures still use the portable build and the explicitly labelled shim.
No application state/function/debug API is exposed or replaced by this test.
"""
import argparse
import hashlib
import json
import shutil
import subprocess
from pathlib import Path
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright


parser = argparse.ArgumentParser()
parser.add_argument('--browser', default=None)
parser.add_argument('--output', default='qa-output-discovery')
parser.add_argument('--url', default=None)
args = parser.parse_args()
out = Path(args.output)
out.mkdir(parents=True, exist_ok=True)
offline = Path('dist/becoming.html').read_text()
contract = json.loads(subprocess.check_output([
    'node', '--input-type=module', '-e',
    "import {JOURNEY_KEY,freshJourney} from './src/journey.js';"
    "import {initialState} from './src/domain.js';"
    "console.log(JSON.stringify({key:JOURNEY_KEY,fresh:freshJourney(),demo:initialState()}));",
], text=True))
KEY = contract['key']
DEMO_KEY = 'becoming-comparative-v2'
DEMO_RAW = json.dumps(contract['demo'], separators=(',', ':'))
SEED = {DEMO_KEY: DEMO_RAW, 'unrelated-app-key': 'leave this unchanged'}
INTEREST = 'Games with my friends'
STORY = ('During our last cooperative game, I split the boss fight into phases, '
         'agreed who would call each phase, and changed the plan after a failed attempt.')
DIRECTION = 'Make a short raid guide that my friends can try'
REWARD = 'Enjoying the game together and making it easier for a new friend to join'
ACTION = 'Write the first three steps of the raid guide and ask one friend to try them'
OUTCOME = 'My instructions confused my friend. Planning the raid did not mean I could explain it clearly.'
UNCERTAIN = 'We have not had another game yet, so I do not know whether this will help.'
HOSTILE = '<img src=x onerror="window.__injected=true"> & <script>window.__injected=true</script>'
checks, errors, requests, screenshots = [], [], [], []
active_page = None


def check(condition, name):
    if not condition:
        raise AssertionError(name)
    checks.append(name)


def storage_html(seed=None, mode='normal'):
    """Inject a Storage environment into this test document, never shipped files."""
    seed_json = json.dumps(SEED if seed is None else seed).replace('<', '\\u003c')
    script = r"""
    (() => {
      const values = new Map(Object.entries(SEED));
      const mode = MODE, writes = [], deletes = [];
      const fault = name => { throw new DOMException('Test-only storage fault', name); };
      const storage = {
        get length() { return values.size; },
        key(index) { return [...values.keys()][index] ?? null; },
        getItem(key) { return values.has(String(key)) ? values.get(String(key)) : null; },
        setItem(key, value) {
          if (mode === 'full') fault('QuotaExceededError');
          writes.push(String(key)); values.set(String(key), String(value));
        },
        removeItem(key) {
          if (mode === 'delete-blocked') fault('SecurityError');
          deletes.push(String(key)); values.delete(String(key));
        },
        clear() { fault('SecurityError'); }
      };
      Object.defineProperty(window, '__DISCOVERY_STORAGE_TEST__', {
        value: {snapshot: () => Object.fromEntries(values), writes, deletes}
      });
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        get: () => mode === 'unavailable' ? fault('SecurityError') : storage
      });
    })();
    """.replace('MODE', json.dumps(mode), 1).replace('SEED', seed_json, 1)
    return offline.replace('<head>', '<head><script>' + script + '</script>', 1)


def watch(page):
    global active_page
    active_page = page
    page.set_default_timeout(10000)
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.on('request', lambda request: requests.append(request.url))
    return page


def snapshot(page):
    return page.evaluate("""() => window.__DISCOVERY_STORAGE_TEST__
      ? window.__DISCOVERY_STORAGE_TEST__.snapshot()
      : Object.fromEntries(Array.from({length:localStorage.length}, (_, i) => {
          const key = localStorage.key(i); return [key, localStorage.getItem(key)];
        }))""")


def record(page):
    return json.loads(snapshot(page)[KEY])


def route(page, name):
    page.evaluate('(name) => { location.hash = name; }', name)
    page.wait_for_function('(name) => document.querySelector(`nav[aria-label="Main navigation"] a[href="#${name}"]`)?.getAttribute("aria-current") === "page"', arg=name)
    page.wait_for_selector('h1')


def stage(page, name):
    page.wait_for_selector(f'#journey-form[data-stage="{name}"]')
    check(page.locator('#journey-form').count() == 1, f'{name}: exactly one conversational form')
    if name not in ['skills', 'reflection']:
        check(page.locator('#journey-form textarea').count() == 1, f'{name}: one answer control')
        check(page.locator('#journey-form textarea[required]').count() == (0 if name == 'constraints' else 1), f'{name}: correct required/optional status')


def answer(page, name, value):
    stage(page, name)
    page.locator('#journey-answer').fill(value)
    page.locator('#journey-form button[type="submit"]').click()


def controls(page):
    page.get_by_role('button', name='Your data and privacy', exact=True).click()
    page.wait_for_selector('#journey-import')


def dismiss(page):
    page.keyboard.press('Escape')
    page.wait_for_function('!document.querySelector("dialog").open')


def download(page, locator, filename):
    with page.expect_download() as event:
        locator.click()
    event.value.save_as(out / filename)
    return (out / filename).read_text()


def export_record(page, filename):
    controls(page)
    text = download(page, page.locator('dialog [data-action="journey-export"]'), filename)
    dismiss(page)
    return json.loads(text)


def upload(page, value, filename='record.json'):
    payload = value if isinstance(value, str) else json.dumps(value)
    page.locator('#journey-import').set_input_files({
        'name': filename, 'mimeType': 'application/json', 'buffer': payload.encode(),
    })


def capture(page, filename, label):
    page.screenshot(path=str(out / filename), full_page=True)
    screenshots.append({'file': filename, 'description': label,
                        'width': page.viewport_size['width']})


def layout(page, label):
    check(page.locator('h1').count() == 1, f'{label}: one primary heading')
    check(page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'{label}: no horizontal page overflow')
    check(page.get_by_role('button', name='', exact=True).count() == 0, f'{label}: exposed buttons have accessible names')
    check(page.get_by_role('textbox', name='', exact=True).count() == 0, f'{label}: exposed text fields have accessible names')
    check(page.get_by_role('checkbox', name='', exact=True).count() == 0, f'{label}: exposed checkboxes have accessible names')
    check(page.get_by_role('radio', name='', exact=True).count() == 0, f'{label}: exposed radio controls have accessible names')


def check_preserved(page, label):
    saved = snapshot(page)
    check(saved.get(DEMO_KEY) == DEMO_RAW, f'{label}: original synthetic key remains byte-for-byte unchanged')
    check(saved.get('unrelated-app-key') == SEED['unrelated-app-key'], f'{label}: unrelated storage is untouched')


def fixture(browser, seed=None, mode='normal'):
    page = watch(browser.new_page(viewport={'width': 390, 'height': 844}, accept_downloads=True))
    page.set_content(storage_html(seed, mode), wait_until='load')
    page.wait_for_selector('h1')
    return page


def exercise(browser):
    page = watch(browser.new_page(viewport={'width': 1440, 'height': 1000}, accept_downloads=True))
    if args.url:
        response = page.goto(args.url, wait_until='networkidle')
        check(response is not None and response.ok, 'served modular discovery entry loads')
        check("connect-src 'none'" in response.headers.get('content-security-policy', ''), 'served CSP prohibits runtime connections')
        page.evaluate('(seed) => { for (const [key, value] of Object.entries(seed)) localStorage.setItem(key, value); }', SEED)
        page.reload(wait_until='networkidle')
        check(page.evaluate('!window.__DISCOVERY_STORAGE_TEST__'), 'served main journey uses real localStorage, not the offline shim')
    else:
        page.set_content(storage_html(), wait_until='load')
    stage(page, 'interest')
    check(page.locator('h1').inner_text() == 'What has your attention lately?', 'fresh entry begins with interest')
    check(page.get_by_test_id('index-value').count() == 0, 'fresh entry does not invent a visitor score')
    check('no live ai' in page.locator('.discovery-footnote').inner_text().lower(), 'fresh entry explicitly discloses authored prompts, no live AI')
    check('this browser' in page.locator('.discovery-footnote').inner_text(), 'fresh entry explains local data boundary')
    check('An independent concept for the OpenAI ecosystem.' in page.locator('.ecosystem-context').inner_text(), 'independent ecosystem attribution is retained')
    check('Hayden Lindley' in page.locator('.page-footer').inner_text(), 'author attribution is retained')
    check('No OpenAI affiliation' in page.locator('.page-footer').inner_text(), 'no OpenAI affiliation is implied')
    for example in ['Games', 'Music', 'Stories & fandom']:
        check(page.get_by_role('button', name=example, exact=True).count() == 1, f'interest example includes {example}')
    for width in [320, 390, 768, 1440]:
        page.set_viewport_size({'width': width, 'height': 1000})
        layout(page, f'fresh entry at {width}px')
        if width == 390:
            page.set_viewport_size({'width': 390, 'height': 844})
            check(page.locator('#journey-form button[type="submit"]').evaluate('(el) => el.getBoundingClientRect().bottom <= innerHeight'), 'fresh phone Continue is visible without scrolling at 390×844')
        if width in [390, 1440]:
            capture(page, f'fresh-{width}.png', 'Actual fresh discovery UI; ' + ('real served origin' if args.url else 'offline build with test-only Storage environment'))
    page.set_viewport_size({'width': 1440, 'height': 1000})
    page.locator('#journey-form button[type="submit"]').click()
    check(page.locator('#journey-form').get_attribute('data-stage') == 'interest', 'empty required interest cannot advance')
    check(page.evaluate('document.activeElement.id') == 'journey-answer', 'native required validation focuses the answer')
    page.locator('#journey-answer').fill('   ')
    page.locator('#journey-form button[type="submit"]').click()
    check(page.locator('#journey-error').inner_text() != '', 'whitespace-only input has an announced validation error')
    check(page.evaluate('document.activeElement.id') == 'journey-error', 'application validation focuses its announced error')
    check(KEY not in snapshot(page), 'invalid first answer does not create a record')
    page.get_by_role('button', name='Games', exact=True).click()
    check(page.locator('#journey-answer').input_value() == 'Games', 'example is optional editable text')
    answer(page, 'interest', INTEREST)
    stage(page, 'story')
    check(page.evaluate('document.activeElement.tagName') == 'H1', 'advancing focuses the new question heading')
    check(INTEREST in page.locator('.conversation-prompt').inner_text(), 'concrete example prompt uses chosen interest')
    check(page.locator('input[name="skill"]').count() == 0, 'no skill is assigned before a concrete account')
    answer(page, 'story', STORY)
    stage(page, 'skills')
    check(page.locator('input[name="skill"]:checked').count() == 0, 'reported actions are not preselected or inferred')
    check('self-reported evidence' in page.locator('.evidence-caveat').inner_text(), 'skill source is explicitly self-report')
    check('haven’t tested' in page.locator('.evidence-caveat').inner_text(), 'transfer remains explicitly untested')
    page.get_by_role('checkbox', name='Planning', exact=False).check()
    page.get_by_role('checkbox', name='Coordination', exact=False).check()
    page.locator('#journey-form button[type="submit"]').click()
    answer(page, 'direction', DIRECTION)
    answer(page, 'reward', REWARD)
    stage(page, 'constraints')
    check('No diagnosis needed' in page.locator('.conversation-prompt').inner_text(), 'constraints support accommodations without requiring diagnosis')
    answer(page, 'constraints', '')
    answer(page, 'action', ACTION)
    page.wait_for_selector('.chosen-step')
    check(page.locator('.chosen-step h2').inner_text() == ACTION, 'ready view retains the chosen action exactly')
    check(page.get_by_test_id('index-value').count() == 0, 'completed discovery does not award a personal score')
    check('No timer, streak or deadline' in page.locator('.save-note').inner_text(), 'ready view permits stopping and returning on the user’s terms')
    saved = record(page)
    check(saved['stage'] == 'ready' and saved['skills'] == ['planning', 'coordination'], 'stored ready state has only the user-confirmed actions')
    check(saved['story'] == STORY and saved['direction'] == DIRECTION and saved['reward'] == REWARD and saved['constraints'] == '', 'answers form one consistent record, with optional constraints empty')
    check(saved['outcome'] == '' and saved['evidenceStatus'] == 'unreviewed', 'choosing an action cannot fabricate an outcome')
    check_preserved(page, 'completed journey')
    capture(page, 'ready-desktop.png', 'Actual chosen-action screen before reflection')

    before_reload = snapshot(page)
    if args.url:
        page.reload(wait_until='networkidle')
        page.wait_for_selector('.chosen-step')
        check(snapshot(page) == before_reload and page.locator('.chosen-step h2').inner_text() == ACTION, 'real-origin browser reload retains the exact record and chosen step')
    else:
        page.set_content(storage_html(before_reload), wait_until='load')
        page.wait_for_selector('.chosen-step')
        check(snapshot(page) == before_reload and page.locator('.chosen-step h2').inner_text() == ACTION, 'offline simulated reopen reads exact saved bytes; actual-origin reload not claimed')

    route(page, 'record')
    check(page.locator('.record-facts').inner_text().count(STORY) == 1, 'record shows the same concrete example once')
    for value in [INTEREST, DIRECTION, REWARD, ACTION]:
        check(value in page.locator('.record-facts').inner_text(), 'record retains supplied text: ' + value)
    check('not an independent observation' in page.locator('.record-evidence').inner_text(), 'record separates self-report from independent evidence')
    check('Transfer to another setting: untested. Comparative standing: unknown.' in page.locator('.evidence-state').inner_text(), 'record preserves unknown comparative standing and transfer uncertainty')
    capture(page, 'record-desktop.png', 'Actual complete local record with evidence uncertainty')
    for width in [320, 390, 768, 1440]:
        page.set_viewport_size({'width': width, 'height': 1000})
        layout(page, f'record at {width}px')
        route(page, 'today')
        layout(page, f'ready step at {width}px')
        if width == 390:
            capture(page, 'ready-mobile.png', 'Actual chosen-action screen at mobile width')
        route(page, 'record')
    page.set_viewport_size({'width': 1440, 'height': 1000})

    controls(page)
    check('private answers' in page.locator('dialog').inner_text(), 'export explicitly warns that a backup includes private answers')
    check('not encrypted' in page.locator('dialog').inner_text(), 'privacy controls disclose local profile access and no encryption')
    for _ in range(16):
        page.keyboard.press('Tab')
        check(page.evaluate('document.querySelector("dialog").contains(document.activeElement)'), 'Tab remains inside privacy dialog')
    dismiss(page)
    check(page.evaluate('document.activeElement.dataset.action') == 'journey-controls', 'Escape returns focus to privacy control')
    page.emulate_media(reduced_motion='reduce')
    check(page.locator('.btn').first.evaluate('(el) => parseFloat(getComputedStyle(el).transitionDuration) <= 0.001'), 'reduced-motion preference removes meaningful control animation')
    page.emulate_media(reduced_motion='no-preference')
    backup = export_record(page, 'complete-local-record.json')
    check(backup['record'] == record(page), 'full backup matches the current saved record')
    check(STORY in json.dumps(backup) and REWARD in json.dumps(backup), 'backup includes disclosed private text')

    route(page, 'today')
    page.locator('[data-action="journey-reflect"]').click()
    stage(page, 'reflection')
    page.locator('#journey-answer').fill(OUTCOME)
    page.get_by_role('radio', name='It challenges it or shows a limit', exact=True).check()
    page.locator('#journey-form button[type="submit"]').click()
    check('A limit or contradiction worth keeping' in page.locator('.outcome-note').inner_text(), 'contradictory outcome remains visible without automatic praise')
    check(OUTCOME in page.locator('.outcome-note').inner_text(), 'contradictory account is retained verbatim')
    route(page, 'record')
    check('Challenged by your later account' in page.locator('.evidence-state').inner_text(), 'contradiction propagates to the durable record')
    route(page, 'today')
    page.locator('[data-action="journey-next"]').click()
    check('previous step' in page.locator('dialog').inner_text(), 'choosing a new step explains that previous findings remain')
    page.locator('#journey-next-form textarea[name="answer"]').fill('Ask my friend to point out one confusing instruction')
    page.locator('#journey-next-form button[type="submit"]').click()
    check(record(page)['outcome'] == '' and record(page)['evidenceStatus'] == 'unreviewed', 'new next step begins with no invented outcome')
    attempts = record(page)['attempts']
    check(len(attempts) == 1 and attempts[0]['nextStep'] == ACTION and attempts[0]['outcome'] == OUTCOME, 'new step preserves the previous action and contradictory outcome')
    check(attempts[0]['story'] == STORY and attempts[0]['skills'] == ['planning', 'coordination'] and attempts[0]['evidenceStatus'] == 'contradicts', 'previous attempt preserves original context and uncertainty')
    prior_attempt_bytes = snapshot(page)
    if args.url:
        page.reload(wait_until='networkidle')
    else:
        page.set_content(storage_html(prior_attempt_bytes), wait_until='load')
    page.wait_for_selector('.chosen-step')
    check(record(page)['attempts'] == attempts, 'earlier attempt survives ' + ('real-origin reload' if args.url else 'offline simulated reopen'))
    route(page, 'record')
    page.locator('.attempt-record summary').click()
    check(OUTCOME in page.locator('.attempt-record').inner_text(), 'earlier contradiction is inspectable in the durable record')
    check('self-reported, transfer untested' in page.locator('.attempt-record').inner_text(), 'archived finding retains source and transfer uncertainty')
    # Add a result to the current step, then correct it rather than starting anew.
    route(page, 'today')
    page.locator('[data-action="journey-reflect"]').click()
    page.locator('#journey-answer').fill('That follow-up question was still too broad to be useful.')
    page.get_by_role('radio', name='It challenges it or shows a limit', exact=True).check()
    page.locator('#journey-form button[type="submit"]').click()
    route(page, 'record')
    page.locator('[data-action="journey-edit"]').click()
    page.locator('#journey-edit-form textarea[name="nextStep"]').fill('Ask my friend which instruction was unclear before rewriting it')
    page.locator('#journey-edit-form button[type="submit"]').click()
    check(record(page)['outcome'] == '' and record(page)['evidenceStatus'] == 'unreviewed', 'correcting next step clears stale outcome and conclusion')
    check(OUTCOME not in page.locator('.record-facts').inner_text(), 'old outcome cannot silently support a corrected next step')
    changed = record(page)['decisions'][-1]
    check(changed['kind'] == 'correction' and 'nextStep' in changed['fields'] and 'outcome' in changed['fields'], 'correction records affected field names')
    check(OUTCOME not in json.dumps(record(page)['decisions']), 'correction history does not retain replaced private wording')
    check(record(page)['attempts'] == attempts, 'correcting current step does not change the archived original attempt')
    route(page, 'today')
    page.locator('[data-action="journey-reflect"]').click()
    page.locator('#journey-answer').fill(UNCERTAIN)
    page.get_by_role('radio', name='I’m not sure yet', exact=True).check()
    page.locator('#journey-form button[type="submit"]').click()
    check('Still uncertain' in page.locator('.outcome-note').inner_text(), 'uncertain reflection remains uncertain')
    route(page, 'record')
    check('Your outcome is uncertain' in page.locator('.evidence-state').inner_text(), 'uncertainty propagates to the record')
    page.locator('[data-action="journey-clear-result"]').click()
    page.get_by_role('button', name='Keep result', exact=True).click()
    check(record(page)['outcome'] == UNCERTAIN, 'cancelling result removal retains uncertain outcome')
    page.locator('[data-action="journey-clear-result"]').click()
    page.locator('[data-action="journey-confirm-clear-result"]').click()
    check(record(page)['outcome'] == '' and record(page)['evidenceStatus'] == 'unreviewed', 'explicit result removal clears current result and conclusion')
    check(record(page)['attempts'] == attempts, 'clearing current result retains separate earlier attempts')
    page.locator('.attempt-record summary').click()
    page.locator('[data-action^="journey-remove-attempt:"]').click()
    page.get_by_role('button', name='Keep attempt', exact=True).click()
    check(record(page)['attempts'] == attempts, 'cancelling attempt removal keeps its original context')
    page.locator('[data-action^="journey-remove-attempt:"]').click()
    page.locator('[data-action^="journey-confirm-remove:"]').click()
    check(record(page)['attempts'] == [], 'explicit attempt removal deletes the selected saved attempt')

    # Real text rendering, including imports, must never turn private words into HTML.
    page.locator('[data-action="journey-edit"]').click()
    page.locator('#journey-edit-form textarea[name="interest"]').fill(HOSTILE)
    page.locator('#journey-edit-form textarea[name="constraints"]').fill('Short sessions, captions, and help from a friend')
    page.locator('#journey-edit-form button[type="submit"]').click()
    check(HOSTILE in page.locator('.record-facts').inner_text(), 'hostile-looking private text renders literally')
    check(page.locator('.record-facts img, .record-facts script').count() == 0 and not page.evaluate('Boolean(window.__injected)'), 'private text cannot inject executable markup')
    check(record(page)['constraints'] == 'Short sessions, captions, and help from a friend', 'constraints and accommodations remain user-chosen and correctable')
    current = snapshot(page)
    controls(page)
    invalids = [
        ('invalid-json', '{broken'),
        ('future-version', {**backup['record'], 'version': 99}),
        ('unsupported-field', {**backup['record'], 'personalScore': 100}),
        ('malformed-actions', {**backup['record'], 'skills': ['invented-talent']}),
        ('inconsistent-stage', {**backup['record'], 'story': ''}),
    ]
    for label, invalid in invalids:
        upload(page, invalid, label + '.json')
        page.wait_for_function('document.querySelector("#journey-import-error")?.textContent.length > 0')
        check(page.locator('[data-action="journey-confirm-import"]').count() == 0, label + ': invalid backup never reaches replacement confirmation')
        check(snapshot(page) == current, label + ': invalid import leaves stored bytes unchanged')
    upload(page, backup)
    page.wait_for_selector('[data-action="journey-confirm-import"]')
    check('replaces your current local record' in page.locator('dialog').inner_text(), 'valid restore discloses replacement before applying it')
    check(snapshot(page) == current, 'validated backup is not applied before confirmation')
    page.get_by_role('button', name='Cancel', exact=True).click()
    check(snapshot(page) == current, 'cancelled restore leaves the current record unchanged')
    controls(page)
    upload(page, backup)
    page.wait_for_selector('[data-action="journey-confirm-import"]')
    page.locator('[data-action="journey-confirm-import"]').click()
    page.wait_for_selector('.chosen-step')
    check(record(page) == backup['record'], 'explicit restore replaces record with the validated backup exactly')
    check_preserved(page, 'restore')
    controls(page)
    hostile_backup = {**backup, 'record': {**backup['record'], 'interest': HOSTILE}}
    upload(page, hostile_backup, 'literal-private-text.json')
    page.wait_for_selector('[data-action="journey-confirm-import"]')
    check(HOSTILE in page.locator('dialog').inner_text(), 'validated restore preview escapes private text literally')
    check(page.locator('dialog img, dialog script').count() == 0 and not page.evaluate('Boolean(window.__injected)'), 'restore preview cannot execute markup from a backup')
    page.get_by_role('button', name='Cancel', exact=True).click()
    check(record(page) == backup['record'], 'cancelling a literal-text import keeps the original restored record')
    controls(page)
    page.locator('[data-action="journey-delete"]').click()
    check('Downloaded backups' in page.locator('dialog').inner_text(), 'erase confirmation names its local-only scope')
    page.get_by_role('button', name='Keep my record', exact=True).click()
    check(record(page) == backup['record'], 'cancelled erase retains saved record')
    check(page.evaluate('document.activeElement.dataset.action') == 'journey-controls', 'cancelling a nested erase dialog returns focus to the visible privacy trigger')
    controls(page)
    page.locator('[data-action="journey-delete"]').click()
    page.locator('[data-action="journey-confirm-delete"]').click()
    stage(page, 'interest')
    check(KEY not in snapshot(page), 'explicit erase removes only discovery key')
    check_preserved(page, 'erase')

    # Each following page is explicitly an offline Storage fault fixture.
    saved_seed = {**SEED, KEY: json.dumps(backup['record'])}
    for mode in ['unavailable', 'full']:
        fault = fixture(browser, SEED if mode == 'unavailable' else saved_seed, mode)
        if mode == 'unavailable':
            check('session-only' in fault.locator('.storage-warning').inner_text(), 'unavailable storage is visible before entering text')
            answer(fault, 'interest', INTEREST)
            stage(fault, 'story')
        else:
            route(fault, 'record')
            fault.locator('[data-action="journey-edit"]').click()
            fault.locator('#journey-edit-form textarea[name="nextStep"]').fill('A step that exists only in this session')
            fault.locator('#journey-edit-form button[type="submit"]').click()
            route(fault, 'today')
            check('A step that exists only in this session' in fault.locator('.chosen-step').inner_text(), 'full storage leaves session edits usable')
            check(snapshot(fault)[KEY] == saved_seed[KEY], 'full storage does not overwrite previous persisted record')
        check('session-only' in fault.locator('.storage-warning').inner_text(), mode + ': persistent warning states session-only retention')
        exported = export_record(fault, mode + '-session-record.json')
        check(exported['record']['interest'] == INTEREST, mode + ': session remains exportable')
        route(fault, 'record')
        check(fault.locator('.storage-warning').is_visible(), mode + ': warning follows navigation into record')
        check_preserved(fault, mode)
        capture(fault, mode + '-storage.png', 'Actual offline build with a test-only ' + mode + ' Storage fault')
        fault.close()

    for label, raw in [('corrupt', '{not JSON'), ('future', json.dumps({**backup['record'], 'version': 99})), ('empty', '')]:
        recovery = fixture(browser, {**SEED, KEY: raw})
        check('needs attention' in recovery.locator('.storage-warning').inner_text(), label + ': incompatible saved data enters recovery')
        check(recovery.locator('#journey-form button[type="submit"]').is_disabled(), label + ': new answers cannot overwrite unreadable data')
        original = download(recovery, recovery.locator('.storage-warning [data-action="journey-recovery"]'), label + '-original.json')
        check(original == raw, label + ': original saved bytes can be downloaded unchanged')
        check(snapshot(recovery)[KEY] == raw, label + ': reading/downloading does not rewrite invalid data')
        check(recovery.evaluate('window.__DISCOVERY_STORAGE_TEST__.writes.length') == 0, label + ': recovery performs no silent writes')
        controls(recovery)
        upload(recovery, backup)
        recovery.wait_for_selector('[data-action="journey-confirm-import"]')
        check(snapshot(recovery)[KEY] == raw, label + ': recovery retains original bytes until restore confirmation')
        recovery.get_by_role('button', name='Cancel', exact=True).click()
        check(snapshot(recovery)[KEY] == raw, label + ': cancelled recovery retains original bytes')
        controls(recovery)
        upload(recovery, backup)
        recovery.wait_for_selector('[data-action="journey-confirm-import"]')
        recovery.locator('[data-action="journey-confirm-import"]').click()
        recovery.wait_for_selector('.chosen-step')
        check(record(recovery) == backup['record'], label + ': confirmed compatible backup repairs recovery')
        check_preserved(recovery, label + ' recovery')
        recovery.close()

    blocked_delete = fixture(browser, saved_seed, 'delete-blocked')
    controls(blocked_delete)
    blocked_delete.locator('[data-action="journey-delete"]').click()
    blocked_delete.locator('[data-action="journey-confirm-delete"]').click()
    check(snapshot(blocked_delete)[KEY] == saved_seed[KEY], 'failed deletion retains persisted bytes')
    check('could not be deleted' in blocked_delete.locator('#live').inner_text(), 'failed deletion does not claim success')
    dismiss(blocked_delete)
    check(blocked_delete.locator('.chosen-step h2').inner_text() == ACTION, 'failed deletion retains in-memory record')
    blocked_delete.close()

    recovery_erase = fixture(browser, {**SEED, KEY: '{corrupt original'})
    controls(recovery_erase)
    recovery_erase.locator('[data-action="journey-delete"]').click()
    recovery_erase.get_by_role('button', name='Keep my record', exact=True).click()
    check(snapshot(recovery_erase)[KEY] == '{corrupt original', 'cancelled recovery erase preserves unreadable original bytes')
    controls(recovery_erase)
    recovery_erase.locator('[data-action="journey-delete"]').click()
    recovery_erase.locator('[data-action="journey-confirm-delete"]').click()
    stage(recovery_erase, 'interest')
    check(KEY not in snapshot(recovery_erase), 'explicit recovery erase allows a fresh start')
    check_preserved(recovery_erase, 'recovery erase')
    recovery_erase.close()

    correction = fixture(browser, saved_seed)
    correction.locator('[data-action="journey-step"]').click()
    check(correction.locator('dialog textarea').count() == 1, 'making a step smaller asks only for the current action')
    correction.locator('dialog #journey-answer').fill('Write just the opening line')
    correction.locator('dialog #journey-form button[type="submit"]').click()
    check(correction.locator('.chosen-step h2').inner_text() == 'Write just the opening line', 'single-question step adjustment becomes the current action')
    route(correction, 'record')
    correction.locator('[data-action="journey-edit"]').click()
    correction.locator('#journey-edit-form textarea[name="story"]').fill('Actually, I watched a friend coordinate the raid and only followed their directions.')
    correction.locator('#journey-edit-form button[type="submit"]').click()
    check(record(correction)['skills'] == [], 'changing the story clears previously checked actions rather than reattaching them')
    check(record(correction)['outcome'] == '' and record(correction)['evidenceStatus'] == 'unreviewed', 'changed story has no stale outcome or conclusion')
    route(correction, 'today')
    stage(correction, 'skills')
    check(correction.locator('input[name="skill"]:checked').count() == 0, 'changed story explicitly reopens optional action confirmation')
    correction.close()

    # Optional actions can be skipped; no hidden taxonomy gate exists.
    optional = fixture(browser)
    answer(optional, 'interest', 'Music')
    answer(optional, 'story', 'I replayed a song and listened closely to the bridge.')
    stage(optional, 'skills')
    optional.locator('#journey-form button[type="submit"]').click()
    stage(optional, 'direction')
    check(record(optional)['skills'] == [], 'leaving all action choices blank is allowed')
    optional.close()
    check(not errors, f'no JavaScript runtime errors: {errors}')
    allowed = urlparse(args.url).netloc if args.url else None
    external = [url for url in requests if urlparse(url).scheme in ['http', 'https'] and urlparse(url).netloc != allowed]
    check(not external, f'no external model, analytics, or asset requests: {external}')
    page.close()


result = {
    'method': ('served modular main journey with real-origin reload; portable offline Storage fault fixtures'
               if args.url else 'actual portable HTML via set_content; test-only Storage shim and simulated reopen'),
    'portable_sha256': hashlib.sha256(offline.encode()).hexdigest(),
    'viewports': [320, 390, 768, 1440],
    'not_verified': ['screen-reader audit', 'human usability study', 'assessment calibration', 'production deployment']
                    + ([] if args.url else ['real-origin localStorage reload', 'served modular entry and CSP']),
}
try:
    with sync_playwright() as pw:
        options = {'headless': True}
        executable = args.browser or shutil.which('chromium') or shutil.which('chromium-browser')
        if executable:
            options['executable_path'] = executable
        browser = pw.chromium.launch(**options)
        result['browser'] = browser.version
        try:
            exercise(browser)
        except Exception:
            if active_page and not active_page.is_closed():
                active_page.screenshot(path=str(out / 'failure.png'), full_page=True)
            raise
        finally:
            browser.close()
    result.update({'passed': len(checks), 'checks': checks, 'page_errors': errors,
                   'screenshots': screenshots, 'status': 'passed'})
    (out / 'browser-results.json').write_text(json.dumps(result, indent=2))
    print(json.dumps(result, indent=2))
except Exception as error:
    if active_page and not active_page.is_closed():
        try:
            active_page.screenshot(path=str(out / 'failure.png'), full_page=True)
        except Exception:
            pass
    result.update({'passed': len(checks), 'checks': checks, 'page_errors': errors,
                   'screenshots': screenshots, 'status': 'failed', 'failure': str(error)})
    (out / 'partial-results.json').write_text(json.dumps(result, indent=2))
    raise
