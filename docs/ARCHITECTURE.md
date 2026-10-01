# Architecture — interest-led surface, steady evidence protocol

Contract `becoming-discovery/1` + preserved `becoming-product/2` · App `0.3.1`; discovery/measurement behavior unchanged from `0.3.0`.

## New local discovery layer

`src/journey.js` owns pure validated state transitions, backup parsing and storage boundary functions. `src/discovery.js` renders deterministic prompts and the inspectable record. `src/discovery.css` gives this layer a restrained, readable layout. `src/app.js` coordinates the shared shell, validated user actions and dialogs. No model/provider/backend dependency is introduced.

The default route is `#today`; `#record` exposes the same saved context. `#board` and all previous hashes still open the unchanged synthetic measurement engine. Three primary destinations replace eight first-use menu items. Within Explore demo, the original routes remain explicit secondary navigation, with the fictional-data boundary visible.

The local record is version 1 under `becoming-journey-v1`. The existing synthetic version 2 remains under `becoming-comparative-v2`, unchanged. Loading a prior demo profile does not populate the real record and does not assign its score to the visitor. Interest answers never feed `estimate`, `becomingIndex`, percentile, or review evidence.

Each submitted answer commits a validated state transition. Unsaved form text is not persisted. A returning visit resumes the next saved stage. Corrections are atomic; changing the example, selected actions, direction or next step clears dependent outcome conclusions. Change history retains field names, dates and revision metadata, not the replaced private text. Choosing a new step after reflection explicitly archives the completed attempt with its original context and uncertainty, separate from the metadata-only correction log. Up to 20 attempts are retained, inspectable and removable; reaching the limit asks for export/removal and never silently prunes. Changing a current action is a correction and does not manufacture a completed attempt. Record deletion affects only the named key; exported copies remain outside app control.

LocalStorage is unencrypted and unauthenticated. Invalid/future-version saved data triggers recovery before normal writes; original bytes can be downloaded, then explicitly replaced with a validated backup or erased. Write failures leave a usable session with a persistent warning. File restore validates before showing a replacement confirmation. No export is uploaded or automatically shared.

The current-setting actions are user-confirmed self-report. They are not independently observed performance and carry no numeric score. Reflection explicitly records supports/contradicts/uncertain; transfer elsewhere remains untested. The UI does not infer health, personality, worth, proficiency or motivation from text.

## Preserved comparative architecture

The remaining sections describe the explicitly fictional instrument. The old placement-first navigation is now secondary; its domain semantics are unchanged.

## 1. Shipped system

```text
Browser-local subject state                    Versioned reference snapshot
 evidence + source grants                       120 synthetic participant profiles
 projects + adopted practices                   membership + permission + observations
 audit + derived history                        intentionally shared practice bundles
          │                                                   │
          └────────────── src/domain.js ────────────────────────┘
                 eligibility / estimates / same-basket comparisons
                 Becoming Index / nearest person / frozen target
                                  │
                           src/app.js + CSS
         Standing · Compare us · Projects · Movement · Perspectives
                  Evidence · Methodology · Data & consent
                                  │
                  localStorage / manual download only
```

There is no application backend, model call, analytics collector, authentication service or live participant ingestion. The subject and every reference person are fictional. Project reflections and review notes are browser-local. The application is an interactive implementation, not a server placeholder.

`src/participants.js` owns a deterministic reference snapshot and cohort metadata. `src/domain.js` owns pure measurements plus explicit state-changing operations. `src/app.js` owns navigation, rendering, forms, native dialogs and downloads. The original `styles.css`, constellation and practice-art vocabulary are retained. Version 0.3.1 replaces the mark with the person-and-rising-path symbol and updates secondary ecosystem labels. `comparative.css` provides the detailed demo layout and brand treatment; discovery remains the default entry.

## 2. Measurement contract

An eligible subject demonstration must be accepted, have an active source grant, match `becoming-demo/1` and `becoming-demonstration/1`, carry the requested independent/assisted mode, have an integer mark from 0 through 4, and fall within the inclusive 180-day observation window ending at `state.asOf`. Future-dated records are excluded. The release pins its scenario date to September 30, 2026; it does not silently age a frozen demo according to a visitor's wall clock.

Records are ordered by observation date and ID, deduplicated by demonstration ID, then limited to the latest 12. A score requires at least three distinct eligible demonstrations. The arithmetic mean is on the retained 0–4 rubric. Interfaces transform it to 0–100 for capability displays. The minimum sample threshold and recency rule are explicit fixture policies, not validated psychometric conclusions.

The five rubric anchors are: an observed unsuccessful attempt; partial performance with substantive guidance; success on a familiar task; repeated success with explained trade-offs; and transfer to an unfamiliar constraint. A missing demonstration is **not** an observed unsuccessful attempt. The assistance mode remains attached even when a rubric mark is the same.

## 3. Index, coverage and percentiles

Six capabilities have fixed weights of 1/6. Systems thinking and creative coding share the technical dimension, giving that dimension weight 2/6. Rapid prototyping, research judgment, storytelling and facilitation each have weight 1/6.

```text
Index = 250 × Σ(eligible capability mean × fixed weight)
              / Σ(weights of capabilities with a known estimate)

Coverage = 100 × Σ(weights of capabilities with a known estimate)

Midrank percentile = 100 × (reference scores below + 0.5 × ties)
                          / compatible reference people
```

Coverage is rounded to an integer percentage for display. It measures supported index weight, not strength of performance, percent of a person's life understood, or confidence. Each capability slot contributes only when its minimum evidence is met; partial sample counts remain visible in the evidence inspector.

The composite renormalizes observed weights and tells the user when the picture is partial. Peer composites are calculated from **exactly the same observed capabilities and weights**. A fuller peer profile does not receive an unfair advantage from including extra dimensions. Changing a goal changes opportunity ordering, not index weights. Changing a cohort changes placement, not subject evidence or capability means.

Percentiles require at least 30 compatible reference people. Ties use values rounded to four decimal places to avoid floating-point artifacts. The index is not an ordinal position; “597 / 1000” means index points, not 597th place in a cohort of 1000.

The displayed observed envelope is the weighted low/high envelope of the contributing rubric marks. It is descriptive, not a confidence interval or a standard error. Reliability and population representativeness remain uncalibrated. The architecture exposes that uncertainty rather than inventing a confidence percentage.

## 4. Participant comparison boundary

Participant objects separate identity, permission basis, cohort membership, reference version, observation date, per-condition capability observations, and intentionally shared bundle IDs. `participantEstimate` rejects mismatched versions, conditions, dates, permissions and invalid marks. `comparePeople` also requires membership in the selected cohort. No compatible row means no comparison.

`justAhead` orders only strictly higher compatible scores for the selected capability. Ties among possible targets are resolved by stable participant ID. There is no fallback to a flattering or easier population. “No person ahead” is a supported state. An individually authorized comparison can be shown in a 12-person circle while its aggregate percentile remains withheld.

The future adapter must supply legitimately authorized, assessed data, not convert a name or biography into a score. See `DATA-CONTRACTS.md` for fields and production obligations. This release does not implement real participant authentication or source verification.

## 5. Surpass Projects and practices

`projectTarget` calculates a read-only preview. `createProject` stores the same contract: target person or threshold, baseline evidence IDs, current score/percentile, target score/illustrative percentile, cohort, reference version, date, rubric, protocol and assistance mode. An invalid explicit person is rejected, not silently replaced.

A target is normally one twelfth of a rubric point beyond the selected person's observed mean. It is a fixture threshold rule, not a validated smallest meaningful change. At the rubric ceiling, the contract explicitly says that success can match the ceiling; it never manufactures a score above 4. A baseline project instead requires enough accepted demonstrations to make a first estimate.

A project has `active`, `review` or `complete` status. Its checklist changes process state only. Replay supplies a predefined **synthetic** 4/4 transfer record, explains that it did not assess the user's notes, and leaves it pending. Human acceptance updates estimates. Completion requires qualifying project evidence and a current mean meeting the frozen threshold. Rejection or lost supporting evidence reopens work as appropriate.

Practice adoption records the bundle, version and selected items. It creates a project without altering skill. A person-linked practice must be intentionally shared by that comparator. Removing it from the practice library does not erase the provenance of an existing project.

## 6. Revocation, history and disclosure

Individual evidence can be revoked. Source grants can be disconnected and restored. All measurement reads check current eligibility, so exclusion propagates to both assistance modes, composites, coverage, comparison, project status and exports. Restoration does not erase individual revocation.

Acceptance, individual revocation and changed source grants append actual derived snapshots. Rejection, unchanged grants, checklist completion, practice adoption and cohort switching do not fabricate measurement events. Starting history is derived from dated starting evidence, not an invented achievement story.

Movement uses matching capability baskets, modes and reference versions within the requested 7/30/90-day window. Index and percentile baselines are reported separately when the first valid reference comparison occurs later. Coverage changes are not described as growth. The history graph is event-spaced, not time-scaled; it omits unknown scores and breaks lines when the observed basket changes. Its table exposes exact values and dates.

A selective JSON disclosure includes only synthetic estimates, conditions, counts, composite context and coverage. It omits raw evidence, private reflections, review notes, adopted tastes and audit content. A project brief intentionally includes that project's reflection because the user explicitly downloads the brief. Neither export is uploaded automatically.

## 7. Persistence, security and deployment

The versioned key is `becoming-comparative-v2`. `isState` rejects malformed or incompatible local structures; no v1 anti-ranking state is silently migrated. Blocked storage falls back to an in-memory session with a visible notice. Local storage is not encrypted, authenticated or tamper-proof. Do not enter sensitive real assessment records into this demo.

User-controlled titles, notes and other displayed values are escaped. Forms, version gates and state limits are enforced in the engine. Native modal dialogs include explicit Tab wrapping, Escape dismissal and focus restoration. There are no client fetch/WebSocket/model/analytics calls.

The build copies a static modular site to `dist` and also creates `dist/becoming.html`, with CSS, fixture modules and Markdown documentation embedded. The tiny bundler deliberately expects single-line source imports/exports and rejects unresolved module boundaries. It is not a general-purpose bundler.

`vercel.json` retains the GitHub → Vercel path, no environment variables and a `connect-src 'none'` content security policy. The portable HTML is a downloadable attachment on Vercel; the hosted app uses external same-origin modules. The loopback server applies the equivalent development headers to production output. Actual deployed headers and account limits require deployment-specific verification.

## 8. Production extension gates

A real service needs an authenticated subject/evidence vault, scoped participant grants, assessment and reviewer identities, authenticated reference snapshots, deletion/revocation propagation, correction and appeal workflows, and validated cohort construction. Protect all derived disclosures, caches and history that can reveal withdrawn source material; retaining a local synthetic audit trail here is not a production erasure design.

Introduce those services behind explicit participant/evidence adapters. Keep the measurement functions testable, the observed basket stable, and the product independent of Emergence. Do not describe a future adapter as a shipped integration.

## 0.2.1 packaging and branding boundary

The measurement contract, state version and browser-local storage key are unchanged. Branding is confined to presentation, metadata and documentation. The build carries both the root OpenAI-only license and `licenses/MIT-legacy.txt`; the portable HTML embeds their full text for offline downloads. Earlier MIT material remains separately licensed as recorded in `LICENSE-HISTORY.md`. `BRAND.md` defines the independent ecosystem descriptor; no OpenAI account or model integration is implied.
