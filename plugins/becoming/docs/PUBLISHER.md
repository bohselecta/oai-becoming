# Publisher, rights and publication gate

Requested public publisher: **Corgi-Verse Software**. Product: **Becoming**.
Author/copyright: **Hayden Lindley**. Preserve independent ChatGPT/OpenAI language;
no affiliation, certification, partnership or directory availability claim.
No publisher account, company verification, agreement or domain was created.

## Required owner decisions

1. **Rights conflict:** the root Becoming OpenAI-Only License 1.0 grants defined
   OpenAI entities reuse rights. Section 1 explicitly excludes independent
   developers/partners merely using OpenAI services. Section 3 reserves ordinary
   rights for everyone else; section 2 requires written authorization for broader
   sublicense/transfer. It does not, by itself, grant an independently operated
   Corgi-Verse Software publisher the right to run or redistribute new restricted
   materials. Hayden retains rights and may authorize his own publishing vehicle;
   confirm that relationship and scope explicitly. The user's instruction
   authorizes this implementation/review PR, not a rewritten general license.
   **Decision pending: publisher authorization or an owner-approved separate grant.**
2. Preserve `LICENSE`, `docs/LICENSE-HISTORY.md`, `licenses/MIT-legacy.txt` and the
   prior MIT boundary byte for byte. Do not call current Becoming open source or
   extend the grant to all ChatGPT users. Do not replace the copyright author with
   the requested publisher. New integration material follows the existing license
   unless the owner separately directs otherwise.
3. Verify the publisher's legal/account identity, domain control and right to use
   **Corgi-Verse Software** as its display name. Choose privacy/support contacts,
   jurisdiction and any organization/account verification needed by the current
   OpenAI portal. The exact portal requirements were not accessible here; the
   [source/access record](REQUIREMENTS.md) distinguishes checked material from
   destinations requiring recheck.
4. Personally review current App Developer Terms and applicable policies. Only
   the user may approve/accept agreements. The build did not accept any terms.
5. Approve hosting/IdP provider, cost, region, audience/scope configuration,
   reviewer operators, backups/deletion window and incident/support responsibilities.
   A consent form is not a substitute for an approved operational privacy policy.
6. Review the descriptive scoring protocol before inviting real participants.
   Human-reviewed observations and opting in do not establish empirical calibration
   or a representative benchmark. Keep every unvalidated/small-sample limit visible.
7. Personally review the exact release source, live test evidence, listing copy,
   icon/screenshots and first-party URLs before deployment or app submission.

## Third-party rights

The integration depends on the official MCP SDK, jose and zod, plus their pinned
lockfile dependencies. Their own license metadata and packaged notices are in
[dependency-inventory.json](dependency-inventory.json) and
[THIRD-PARTY-NOTICES.txt](THIRD-PARTY-NOTICES.txt). Those licenses cover those
packages only and do not broaden Becoming's original-material grant. Dependencies
are installed with scripts disabled and are not committed as `node_modules`.
The package is private to prevent accidental npm publication. OpenAI's examples
were inspected as references; no example code/assets were copied into this package.
The integration reuses Becoming's exact original mark; no third-party logo or font
is distributed. Retain applicable notices with any authorized redistribution.

## Release gate

Reviewable branch/draft PR publication was explicitly authorized. Product deployment,
public tunnel/preview, spending, agreement acceptance, directory submission and final
publication are **not** authorized. Technical test success does not constitute the
owner's acceptance or approval of the license/publisher/privacy decisions.
