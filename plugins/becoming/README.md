# Becoming — ChatGPT app integration

By **Corgi-Verse Software**, requested publisher. Created by **Hayden Lindley**.
Independent integration intended for ChatGPT; no affiliation, endorsement or
published directory availability is claimed. Status: working locally tested code,
with live account/ChatGPT checks and publication held for owner review.

This folder is the requested plugin package. It implements an **Apps SDK app using
MCP**, with executed tools and an embedded widget, rather than a retired ChatGPT
plugin manifest. **Codex is the builder; ChatGPT is the user-facing host.**
The original Becoming 0.3.1 static app remains intact and independently runnable.

- [Frozen implementation contract](CONTRACT.md) and [acceptance checklist](ACCEPTANCE.md)
- [Install and configure](INSTALL.md)
- [Architecture and tool/data contracts](docs/ARCHITECTURE.md)
- [Verified official requirements and blocked sources](docs/REQUIREMENTS.md)
- [Privacy disclosure draft](docs/PRIVACY.md), [listing package](docs/LISTING.md)
- [Publisher and license decisions](docs/PUBLISHER.md)
- [Release evidence](docs/RELEASE.md) and [continuation handoff](HANDOFF.md)

## Credential-free verification

From the repository root, run `npm run check` to check/build the existing app.
The integration needs **Node 24.13+** for built-in SQLite; the standalone app keeps
its existing Node 22+ requirement and zero runtime npm dependencies.

```bash
cd plugins/becoming
npm ci --ignore-scripts
npm test
npm audit --omit=dev
python -m pip install -r ../../tests/requirements.txt
python -m playwright install chromium
npm run test:browser
```

The integration tests use a real HTTP MCP server, official MCP client, real JWT
signature verification, a test-only OAuth/OIDC server and temporary encrypted
SQLite databases. Browser verification uses the actual account and widget code
with a visibly labeled substitute for ChatGPT's `window.openai` bridge. Synthetic
identities and reference people exist only in tests. This does not verify a live
ChatGPT account or actual authorization provider.

## What works

Interest-led answers, saved return context, contradictory/uncertain reflections,
correctable evidence accounts, durable storage, optimistic revisions, retry receipts,
human consent, export/confirmed restore/erase, separate human-review authorization,
transparent same-condition/same-basket comparison and frozen concrete growth projects.

Scores require three distinct recent accepted observations. Percentiles require
30 compatible opted-in references and describe the participating sample only.
Independent and assisted conditions remain separate. Missing data stays unknown,
unfavorable results stay visible, and revocation recomputes eligibility and project
status. Reviewed observations use an explicitly unvalidated descriptive rubric.
The original six capabilities remain systems, research, story, prototype,
facilitation and creative. No visitor inherits a fictional score.

There is no scraping, telemetry, OpenAI API key, paid model API call or public-profile
adapter. Public-profile statistics and representative population benchmarks are
honestly unavailable. Human-reviewed evidence can be populated by consenting real
participants after setup; the server ships with zero participants and reviewers.

Existing licenses are preserved. The current OpenAI-only grant does **not**
automatically authorize an independent Corgi-Verse publisher. Resolve that decision
with the owner before hosting/distribution; see [publisher requirements](docs/PUBLISHER.md).
No deployment, agreement acceptance, spending or submission is authorized here.
