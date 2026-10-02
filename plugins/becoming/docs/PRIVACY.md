# Becoming data & privacy — review draft

Publisher requested: Corgi-Verse Software. Author: Hayden Lindley. This integration
has not been deployed or published. Publisher identity, contact address, governing
jurisdiction, retention operations and legal wording require owner approval.
Do not represent this review draft as an approved production privacy policy.

Becoming stores only answers you choose to record: interests, concrete examples,
actions, chosen direction/reward, constraints/accommodations, next steps, reflections
and completed attempts. It also stores submitted demonstration accounts, observation
dates, conditions, human review decisions, growth projects and consent choices.
Constraints may include sensitive personal details; avoid information you do not
want ChatGPT and the configured Becoming service to process. No diagnosis or
sensitive-trait inference is performed. Do not submit third-party private data.

Storage consent is obtained on the signed-in account page. Without it, private
MCP tools cannot read or save records. Comparison has a separate optional grant:
your chosen display name and compatible reviewed observation summaries become
visible to other opted-in participants. Account authentication does not verify your
legal identity. Public availability is never treated as consent. Becoming does not
scrape profiles or implement a public-profile API adapter. There are no purchased,
invented or representative population benchmarks.

The configured identity provider processes sign-in. Becoming validates issuer,
signature, audience, expiration and scopes; it receives an opaque subject identifier.
It stores an HMAC account key rather than raw identity claims. Private payloads,
login verifiers and sessions use authenticated AES-256-GCM encryption on a durable
SQLite volume. The deployment operator holds the encryption key; this is not
end-to-end encryption. No analytics, advertising, tracking or model API calls exist.
No private text or tokens are intentionally logged. Proxy/hosting/IdP logs and their
retention must be reviewed before release. Bearer tokens are never passed to other
APIs. Expiring session tokens are stored only as hashes with encrypted session data.

ChatGPT receives tool inputs and outputs, including recorded private text returned
by record tools. Embedding data in the widget does not hide it from the model. Only
call these tools when the person explicitly wants that disclosure. Static widget
resources contain no private records, credentials or analytics. Widget state does
not persist personal text. Becoming does not control OpenAI's chat retention.
Human reviewers authorized by the publisher can inspect evidence you deliberately
submit; they cannot inspect other participants' ordinary discovery records through
the reviewer page. Reviewed evidence is descriptive and unvalidated, not a credential.

You can inspect/correct your record and replace revoked evidence. Correction history
stores changed field names and dates, not previous private text. Completed attempts
retain the original account until explicitly removed. Latest 100 idempotency receipts
retain hashes and revisions, not input text. No silent pruning of evidence/projects
or attempts occurs; capacity limits require explicit removal. Withdrawal of storage
consent blocks private tool access and removes all observation eligibility; encrypted
data remains available in the account page for export or erase. Withdrawal of comparison
consent removes you from new comparisons and invalidates dependent person-target
project status. Accepted observations can be individually revoked or removed.

A complete private export includes discovery, submitted evidence and projects.
Restore requires confirmation and validates the discovery record only; assessment
marks cannot be imported as accepted evidence. The standalone app remains browser
local; there is no automatic upload or sync. Downloaded copies contain private text.

Account erasure removes retained records, evidence, projects, consent and Becoming
sessions from the active database. A minimal keyed tombstone with erasure time is
retained to block old authorizations from resurrecting data. Other participants'
frozen project metadata may retain the formerly shared name, score and reference
identifier; the target then becomes unavailable. A name already disclosed cannot
be recalled from chats. Tombstones persist until controlled operator key rotation.
Identity-provider data, ChatGPT conversations, downloaded exports and recipients'
copies require separate deletion. Database snapshots, proxy logs and review exports
are NOT automatically deleted by this code; before production the operator must
approve a backup deletion/expiry procedure and communicate its exact window. No
production backup/retention promise is made before that procedure exists.

Access tokens and account sessions are limited to at most one hour. Login flows
expire in ten minutes. Expired temporary rows are purged on startup and access.
Review the data-controller identity, privacy/support contacts, processors, rights
requests, age eligibility, geographical availability, security response and backup
retention before publishing this policy at the owner-approved HTTPS URL.
