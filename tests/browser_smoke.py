"""Reproducible Chromium acceptance: full comparative flow, states, keyboard and sizes.

Default: exercise the built, self-contained HTML with page.set_content. No browser
policy is changed. --url additionally verifies the modular served product and real
origin persistence. A blocked hosted navigation is a failure, never bypassed.
"""
import argparse
import json
import shutil
import subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument('--browser', default=None)
parser.add_argument('--output', default='qa-output')
parser.add_argument('--url', default=None)
args = parser.parse_args()
out = Path(args.output)
out.mkdir(parents=True, exist_ok=True)
offline = Path('dist/becoming.html').read_text()
fixtures = json.loads(subprocess.check_output(['node', 'tests/ui_fixtures.mjs'], text=True))
checks = []
errors = []
requests = []

def check(condition, name):
    if not condition:
        raise AssertionError(name)
    checks.append(name)

headings = {
    'board': 'Know where you stand.', 'people': 'Compare us.',
    'projects': 'Surpass Projects.', 'trajectory': 'Your movement.',
    'perspectives': 'A different way to be inspired.', 'evidence': 'Evidence library.',
    'methodology': 'Every number has a route back.',
    'consent': 'A deeper picture. A smaller footprint.',
    'proposal': 'Where am I among other people?',
}

with sync_playwright() as pw:
    options = {'headless': True}
    executable = args.browser or shutil.which('chromium') or shutil.which('chromium-browser')
    if executable:
        options['executable_path'] = executable
    browser = pw.chromium.launch(**options)
    page = browser.new_page(viewport={'width': 1440, 'height': 1000}, accept_downloads=True)
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('request', lambda r: requests.append(r.url))

    def route(name):
        page.evaluate('(name)=>{location.hash=name}', name)
        page.wait_for_function('(text)=>document.querySelector("h1")?.textContent===text', arg=headings[name])

    def index():
        return page.get_by_test_id('index-value').inner_text()

    def dismiss():
        page.keyboard.press('Escape')
        page.wait_for_function('!document.querySelector("dialog").open')

    def reset():
        route('consent')
        page.locator('[data-action="reset"]').click()
        page.locator('[data-action="confirm-reset"]').click()
        route('board')
        check(index() == '597', 'reset restores the actual derived starting index')

    try:
        if args.url:
            response = page.goto(args.url, wait_until='networkidle')
            check(response.ok, 'served modular entry point loads')
            check("connect-src 'none'" in response.headers.get('content-security-policy', ''), 'served CSP prohibits connections')
        else:
            page.set_content(offline, wait_until='load')
        page.wait_for_selector('h1')
        route('board')  # Discovery is now the default; measure the unchanged explicit demo.
        check(index() == '597', 'starting composite is calculated as 597, not a mockup number')
        check(page.get_by_test_id('index-percentile').inner_text() == '48th percentile', 'starting relative rank is explicit')
        check(page.get_by_test_id('index-coverage').inner_text() == '100%', 'evidence coverage has a separate display')
        check('13th percentile' in page.locator('.capability-card').filter(has=page.get_by_role('heading', name='Creative coding', exact=True)).inner_text(), 'low capability percentile is shown directly')
        check('Synthetic-data demo' in page.locator('.topbar').inner_text(), 'synthetic label is visible before interaction')
        page.locator('[data-action="skill:research"]').first.click()
        check(page.locator('dialog').evaluate('(el)=>el.open'), 'capability evidence inspector opens')
        check(page.locator('.mini-evidence>div').count() == 3, 'capability decomposes into three accepted demonstrations')
        dismiss()
        check(page.evaluate('document.activeElement.dataset.action') == 'skill:research', 'Escape returns focus to the capability trigger')
        page.locator('#cohort').select_option('senior')
        check(index() == '597', 'changing cohort leaves the index unchanged')
        check(page.get_by_test_id('index-percentile').inner_text() == '0th percentile', 'unfavorable senior-cohort standing is not disguised')
        page.locator('#cohort').select_option('circle')
        check(page.get_by_test_id('index-percentile').inner_text() == 'Not ranked', 'small cohort is not given an aggregate rank')
        check(page.locator('.placement-ruler>span').count() == 0, 'missing rank has no false zero-position marker')
        page.locator('#cohort').select_option('global')
        page.locator('[data-action="mode:assisted"]').click()
        check(index() != '597', 'assisted index uses separate evidence')
        page.locator('[data-action="mode:independent"]').click()
        check(index() == '597', 'returning to independent mode restores its own score')

        # Complete the required user journey with actual controls.
        page.locator('.next-card [data-action^="person:"]').click()
        page.wait_for_selector('.compare-table')
        check('Sage Sato' in page.locator('.comparison-title').inner_text(), 'nearest-ahead comparator is the actual compatible fixture person')
        check(page.locator('.compare-table tbody tr').count() == 6, 'Compare Us compares all six supported capabilities')
        check('Synthetic person' in page.locator('.comparison-title').inner_text(), 'comparator is visibly synthetic')
        check('2.1' in page.locator('.compare-table .focused-row').inner_text(), 'the selected source-triangulation gap is explicit')
        page.locator('[data-action^="peer-evidence:"]').click()
        check(page.locator('.reference-marks>span').count() == 12, 'reference profile decomposes into its authored marks')
        check('authored-synthetic-fixture' in page.locator('dialog').inner_text(), 'reference permission basis is inspectable')
        dismiss()
        page.locator('.comparison-card [data-action^="new:"]').click()
        check('62.5' in page.locator('#target-preview').inner_text(), 'project preview shows the real frozen threshold')
        check('52nd → approximately 58th' in page.locator('#target-preview').inner_text(), 'project preview provides a qualified percentile implication')
        page.locator('#project-title').fill('My source-triangulation demonstration')
        page.locator('#project-form button[type="submit"]').click()
        page.wait_for_selector('#reflection')
        project_id = page.locator('#reflection').get_attribute('data-project')
        check('Sage Sato' in page.locator('dialog').inner_text(), 'created project retains the person target')
        check('Independent' in page.locator('dialog').inner_text(), 'created project retains its assistance condition')
        check(page.locator('[data-action^="replay:"]').is_disabled(), 'replay is gated by incomplete demonstration steps')
        for step in range(3):
            page.locator(f'input[data-step="{step}"]').check()
        page.locator('#reflection').fill('PRIVATE REFLECTION: I checked the three independent sources and the counterexample.')
        check(not page.locator('[data-action^="replay:"]').is_disabled(), 'completed steps enable only the synthetic replay')
        with page.expect_download() as event:
            page.locator('[data-action^="brief:"]').click()
        event.value.save_as(out / 'surpass-project.md')
        brief = (out / 'surpass-project.md').read_text()
        check('Frozen evidence contract' in brief and 'Sage Sato' in brief and 'Allowed assistance: independent' in brief, 'portable brief contains the target and evidence contract')
        dismiss()
        route('board')
        check(index() == '597', 'completed checklist does not change index or rank')
        route('projects')
        page.locator(f'[data-action="project:{project_id}"]').click()
        page.locator(f'[data-action="replay:{project_id}"]').click()
        page.wait_for_selector('.review-card')
        pending = page.locator('.review-card').filter(has_text='My source-triangulation demonstration')
        check(pending.count() == 1, 'replay produces a pending evidence record')
        route('board')
        check(index() == '597', 'pending evidence does not change placement')
        route('evidence')
        page.locator('.review-card').filter(has_text='My source-triangulation demonstration').locator('[data-action^="review:"]').click()
        evidence_id = page.locator('dialog [data-action^="accept:"]').get_attribute('data-action').split(':', 1)[1]
        check(page.locator('.assessment-mark').inner_text().startswith('4'), 'reviewer sees the predefined synthetic rubric mark')
        page.locator('#review-note').fill('Condition, provenance and transfer criterion inspected.')
        page.locator(f'[data-action="accept:{evidence_id}"]').click()
        route('board')
        check(index() == '615', 'accepted eligible evidence legitimately moves the index')
        check(page.get_by_test_id('index-percentile').inner_text() == '49th percentile', 'accepted evidence legitimately moves relative placement')
        check('+17.4 pts' in page.get_by_test_id('index-movement').inner_text(), 'movement is separately reported from standing')
        route('trajectory')
        check(page.locator('.history-table tbody tr').count() == 5, 'acceptance creates an actual measurement snapshot')
        check('+1.0 pts' in page.locator('.movement-stats').inner_text(), 'percentile trajectory uses the first compatible rank snapshot')
        page.screenshot(path=str(out / 'movement.png'), full_page=True)
        route('projects')
        page.locator('[data-action="filter:Complete"]').click()
        check(page.locator('.project-card').count() == 1, 'only the demonstrated threshold project is complete')
        page.locator('[data-action="filter:All"]').click()
        route('evidence')
        page.locator(f'[data-action="review:{evidence_id}"]').click()
        page.locator(f'[data-action="revoke:{evidence_id}"]').click()
        page.locator(f'[data-action="confirm-revoke:{evidence_id}"]').click()
        route('board')
        check(index() == '597', 'individual revocation propagates back to standing')
        route('projects')
        page.locator(f'[data-action="project:{project_id}"]').click()
        check('In progress' in page.locator('.dialog-subline').inner_text(), 'revoking qualifying evidence reopens the project')
        dismiss()
        route('consent')
        with page.expect_download() as event:
            page.locator('[data-action="export"]').click()
        event.value.save_as(out / 'capability-packet.json')
        packet = (out / 'capability-packet.json').read_text()
        check('PRIVATE REFLECTION' not in packet and 'Condition, provenance' not in packet, 'selective export excludes private reflections and review notes')
        check(len(json.loads(packet)['claims']) == 12, 'export retains both assistance conditions')
        page.locator('[data-action="bench-toggle"]').click()
        route('board')
        check(page.get_by_test_id('index-percentile').inner_text() == 'Not ranked', 'comparison pause is honored on home')
        route('people')
        check('Comparison unavailable' in page.locator('main').inner_text(), 'comparison pause is honored in Compare Us')
        check(page.locator('.nearby-person').count() == 0, 'paused comparison does not leak nearby ranking suggestions')
        route('consent')
        page.locator('[data-action="bench-toggle"]').click()
        page.locator('[data-action="source:projects"]').click()
        route('board')
        research = page.locator('.capability-card').filter(has=page.get_by_role('heading', name='Research judgment', exact=True))
        check('Unknown / 100' in research.inner_text(), 'source revocation renders unknown, not zero')
        check(page.get_by_test_id('index-coverage').inner_text() == '67%', 'missing capabilities visibly reduce coverage')
        page.locator('[data-action="mode:assisted"]').click()
        check('Unknown / 100' in research.inner_text(), 'source revocation also affects assisted evidence')
        reset()

        # Practice adoption and user-controlled text.
        route('perspectives')
        page.locator('[data-action="perspective:investigator"]').click()
        page.locator('input[name="practice"][value="1"]').uncheck()
        page.locator('#perspective-form button[type="submit"]').click()
        page.wait_for_selector('#reflection')
        check(page.locator('.adopted-practices p').count() == 2, 'chosen shared practices are retained exactly')
        dismiss()
        route('board')
        check(index() == '597', 'practice adoption does not transfer proficiency or rank')
        page.locator('.topbar [data-action="new"]').click()
        hostile = '<img src=x onerror=alert(1)>'
        page.locator('#project-title').fill(hostile)
        page.locator('#project-form button[type="submit"]').click()
        page.wait_for_selector('#reflection')
        check(page.locator('#dialog-title').inner_text() == hostile, 'user project title renders as literal text')
        check(page.locator('#dialog-title img').count() == 0, 'user title cannot inject markup')
        # Native modal traps tab navigation and Escape dismisses it.
        for _ in range(18):
            page.keyboard.press('Tab')
            check(page.evaluate('document.querySelector("dialog").contains(document.activeElement)'), 'keyboard focus stays in the native dialog')
        dismiss()
        reset()

        if args.url:
            route('evidence')
            page.locator('[data-action="review:candidate-story"]').click()
            page.locator('[data-action="accept:candidate-story"]').click()
            route('board')
            remembered = index()
            page.reload(wait_until='networkidle')
            page.wait_for_selector('[data-testid="index-value"]')
            check(index() == remembered and remembered != '597', 'real-origin localStorage survives a browser reload')
            reset()

        for width in [320, 390, 768, 1440]:
            page.set_viewport_size({'width': width, 'height': 1000})
            for name in headings:
                route(name)
                check(page.locator('h1').count() == 1, f'{name} has one primary heading at {width}px')
                check(page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'no page overflow: {name} at {width}px')
                unnamed = page.get_by_role('button', name='', exact=True).count()
                check(unnamed == 0, f'visible buttons are named: {name} at {width}px')
        route('methodology')
        page.locator('.decomposition summary').first.click()
        check(page.locator('.decomposition[open] [data-action^="skill:"]').count() == 2, 'composite decomposes through dimensions to capability evidence')
        page.emulate_media(reduced_motion='reduce')
        check(page.locator('.btn').first.evaluate('(el)=>getComputedStyle(el).transitionDuration') == '1e-05s', 'reduced-motion preference is honored')
        page.emulate_media(reduced_motion='no-preference')

        # The following fixtures exercise the actual built UI, not a separate mockup.
        # Injection is confined to the test document; production has no debug API.
        for name, fixture in fixtures.items():
            variant = browser.new_page(viewport={'width': 390, 'height': 844})
            variant.on('pageerror', lambda e: errors.append(str(e)))
            marker = "let state=initialState(), storageNotice='';"
            check(marker in offline, 'test fixture initialization boundary exists')
            variant.set_content(offline.replace(marker, 'let state=' + json.dumps(fixture) + ", storageNotice='';", 1), wait_until='load')
            variant.wait_for_selector('h1')
            variant.evaluate("location.hash='board'")
            variant.wait_for_selector('[data-testid="index-value"]')
            if name == 'low':
                check(variant.get_by_test_id('index-value').inner_text() == '0', 'observed all-zero fixture renders a real zero index')
                check(variant.get_by_test_id('index-percentile').inner_text() == '0th percentile', 'very low valid percentile renders explicitly')
            elif name == 'high':
                check(variant.get_by_test_id('index-value').inner_text() == '1,000', 'upper-bound composite renders correctly')
                check(variant.get_by_test_id('index-percentile').inner_text() == '100th percentile', 'upper-bound percentile uses actual reference ordering')
                check('No compatible person ahead' in variant.locator('.next-person').inner_text(), 'no comparator is invented above the measurement ceiling')
            elif name == 'partial':
                check(variant.get_by_test_id('index-coverage').inner_text() == '17%', 'very low evidence coverage is explicit')
                check('PARTIAL BECOMING INDEX' in variant.locator('.index-card').inner_text(), 'partial index is visibly named as partial')
                check('A partial picture' in variant.locator('.partial-notice').inner_text(), 'partial interpretation is explained beside the number')
            else:
                check(variant.get_by_test_id('index-value').inner_text() == '—', 'fully unknown state does not become zero')
                check(variant.locator('.placement-ruler>span').count() == 0, 'unknown fixture has no ranking marker')
                variant.evaluate("location.hash='trajectory'")
                variant.wait_for_selector('.trajectory-chart')
                check(variant.locator('.trajectory-chart circle').count() < variant.locator('.history-table tbody tr').count(), 'unknown history points are omitted rather than graphed at zero')
            check(variant.evaluate('document.documentElement.scrollWidth<=innerWidth'), f'{name} fixture has no mobile overflow')
            variant.close()

        page.set_viewport_size({'width': 1600, 'height': 1050})
        route('board')
        page.wait_for_timeout(5600)
        page.screenshot(path=str(out / 'desktop.png'), full_page=True)
        page.screenshot(path=str(out / 'hero.png'))
        for name in ['people', 'methodology', 'projects']:
            route(name)
            page.screenshot(path=str(out / f'{name}.png'), full_page=True)
        page.set_viewport_size({'width': 390, 'height': 844})
        route('board')
        page.screenshot(path=str(out / 'mobile.png'), full_page=True)
        page.screenshot(path=str(out / 'mobile-hero.png'))

        docs_page = browser.new_page(accept_downloads=True)
        docs_page.set_content(offline, wait_until='load')
        docs_page.wait_for_selector('h1')
        docs_page.evaluate("location.hash='proposal'")
        with docs_page.expect_download() as event:
            docs_page.locator('a[href="./docs/ARCHITECTURE.md"]').click()
        event.value.save_as(out / 'architecture.md')
        check('Architecture' in (out / 'architecture.md').read_text(), 'portable build includes downloadable architecture documentation')
        for filename, href, expected in [
            ('current-license.txt', './LICENSE', 'Becoming OpenAI-Only License 1.0'),
            ('legacy-license.txt', './licenses/MIT-legacy.txt', 'MIT License'),
        ]:
            with docs_page.expect_download() as event:
                docs_page.locator(f'.offering-license-links a[href="{href}"]').click()
            event.value.save_as(out / filename)
            received = (out / filename).read_text()
            source = Path('LICENSE' if filename.startswith('current') else 'licenses/MIT-legacy.txt').read_text()
            check(received == source, f'portable download retains complete {filename} verbatim')
            check(received.startswith(expected), f'portable download identifies {filename} accurately')
        for doc in ['BRAND', 'LICENSE-HISTORY']:
            with docs_page.expect_download() as event:
                docs_page.locator(f'a[href="./docs/{doc}.md"]').first.click()
            event.value.save_as(out / f'{doc}.md')
            check((out / f'{doc}.md').read_text() == Path(f'docs/{doc}.md').read_text(), f'portable {doc} document downloads offline')
        check('Offered to OpenAI. Free to build on.' in docs_page.locator('.principle-card').inner_text(), 'offering identifies the intended licensee')
        check('Earlier MIT rights remain intact' in docs_page.locator('.principle-card').inner_text(), 'offering preserves previously released rights visibly')
        check('MIT licensed' not in docs_page.locator('.page-footer').inner_text(), 'footer does not mislabel the current grant as MIT')
        docs_page.close()
        for width in [320, 390, 768, 1440, 1600]:
            page.set_viewport_size({'width': width, 'height': 1000})
            route('board')
            check(page.locator('.ecosystem-context').is_visible(), f'independent ecosystem descriptor visible at {width}px')
            check('An independent concept for the OpenAI ecosystem.' in page.locator('.ecosystem-context').inner_text(), f'ecosystem relationship is unambiguous at {width}px')
            check(page.locator('.brand-author').is_visible(), f'author attribution visible at {width}px')
            check(page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'brand chrome has no horizontal overflow at {width}px')
        if args.url:
            for url_path, source_file in [('LICENSE', 'LICENSE'), ('licenses/MIT-legacy.txt', 'licenses/MIT-legacy.txt')]:
                legal_response = page.request.get(args.url.rstrip('/') + '/' + url_path)
                check(legal_response.ok and legal_response.text() == Path(source_file).read_text(), f'served {url_path} preserves full legal text')
        check(not errors, f'no JavaScript runtime errors: {errors}')
        external = [r for r in requests if r.startswith(('http:', 'https:')) and not (args.url and r.startswith(args.url.rstrip('/') + '/'))]
        check(not external, f'no external model, analytics or asset requests: {external}')
        result = {
            'passed': len(checks), 'checks': checks, 'page_errors': errors,
            'browser': browser.version,
            'method': 'served modular site plus offline fixtures' if args.url else 'built offline HTML via page.set_content; browser policy unchanged',
            'viewports': [320, 390, 768, 1440, 1600],
            'not_verified': ['live deployed Vercel headers', 'screen-reader audit', 'real participants or assessment calibration'] + ([] if args.url else ['real-origin persistence and reload', 'hosted modular entry point and CSP']),
        }
        (out / 'browser-results.json').write_text(json.dumps(result, indent=2))
        print(json.dumps(result, indent=2))
    except Exception:
        page.screenshot(path=str(out / 'failure.png'), full_page=True)
        (out / 'partial-results.json').write_text(json.dumps({'passed': len(checks), 'checks': checks, 'errors': errors}, indent=2))
        raise
    finally:
        browser.close()
