# Pilot operations, deletion and safe recovery

This is the source procedure for the single-process Auth0 + Render pilot. It is
not evidence that a provider backup or deletion operation has been performed.
Keep the existing service and plan; no provisioning, upgrade or new commitment.

## Inspect before enabling real records

The parent uses the authorized Mac to inspect the existing Render service and
Auth0 tenant. Record only non-secret facts: source SHA, region, one instance,
persistent path, plan and displayed cost, snapshot availability/expiry, access-log
retention, Auth0 event-log retention and account-deletion controls. Confirm support
mailbox delivery and who handles rights requests. Do not promise an expiry window
until it has been observed. Provider settings/agreements remain NOT_VERIFIED.

Secrets: keep the original DATA_KEY_SECRET stable in Render protected Environment.
Never copy it to an evidence receipt. Lost keys make records unreadable. Rotating
keys changes both encryption and opaque account IDs; it is not a deletion/restore
procedure. No ongoing credentials are configured without explicit approval.

## Ordinary record controls

- Correct discovery answers in the widget; old conclusions must clear as specified.
- Export from the authenticated account page to private owner-controlled storage.
  Export includes private text. It is not an operator backup and must not enter Git.
- Confirmed import restores only validated discovery answers. Accepted assessments,
  review marks, consent and projects cannot be imported as trusted evidence.
- Withdraw storage to stop private tools and comparison eligibility while retaining
  encrypted data for export/erase. This is not an erasure request.
- Erase from the account page. Verify old sessions and old bearer authorizations
  fail, retained private records disappear and dependent comparisons recompute.
  Minimal keyed erasure tombstones stay in active storage to reject old tokens.
- Handle Auth0 user records, ChatGPT history and downloaded copies separately with
  their owners. Becoming cannot erase those through its own account endpoint.

## Snapshot recovery must not resurrect erased or withdrawn data

**Do not restore an older Render disk snapshot into the running service.** A
snapshot rolls back deletion tombstones, consent withdrawals, evidence revocations
and corrections along with data. Waiting for token expiry does not make the old
consents/data safe. The pilot has no external authoritative deletion/consent ledger
and no automated provider-snapshot reconciliation implementation.

If active storage is corrupt or lost: stop accepting private traffic, preserve the
existing encrypted disk for investigation under the owner's retention instructions,
and keep the app unavailable/setup-only. Do not silently overwrite or reseed it.
There are no operator-created backups in the current pilot. Recovering a provider
snapshot requires a separately reviewed procedure that proves every later deletion,
withdrawal and correction was applied before reopening. If that history is missing,
the snapshot cannot be safely restored. Escalate to Hayden with the affected data,
resource, access and displayed cost; do not provision replacement resources yourself.

An owner-approved fresh start must prevent old tokens/sessions regaining access and
obtain fresh human consent. Users may then explicitly import their own discovery
exports; no assessments are trusted from those exports. Do not describe this as
full database restoration. Keep provider snapshot deletion/expiry and old encrypted
disk disposition outstanding until actual evidence exists.

## Review evidence and support

Keep receipts free of subjects, cookies, bearer/client secrets and private text.
Record source revision, date, operator, result and non-secret provider facts for
each operation. Actual screenshots must be redacted and labeled live or fixture.
The intended support/privacy mailbox is hayden@corgi-verse.com; delivery remains
unverified. General-use policy, service terms, support handling, publisher portal
verification and live listing captures remain gates for Hayden's publication review.
