# Remaining blockers

## Vendor access

- A manual sign-in check verified personal login only; no company/PAS workspace or API access was visible. Company setup and PAS activation are distinct access gates. See the [unsent evaluation request](vendor-evaluation-request.md) for the smallest sandbox or export-only request that unlocks testing.

- No vendor-supported API credentials, scopes, partner agreement, rate limits or revocation behavior have been verified. Keep live connectivity disabled. Existing integrations with accounting vendors do not establish a public API.
- PAS cost reporting is documented, but no native export version has been validated against representative fixtures. PAS and Cost Tracking require separate compatibility verification.

## User input

- A synthetic representative PAS export (CSV and XLSX) and its report settings/filter description would allow a native profile to be validated. No real payroll, bank or personal records are requested.
- A pilot requires a selected project and reviewed mapping/report basis. No credentials or customer authorization are inferred by this library.

## Engineering

- Integrate the tested bounded values-only XLSX worker with host upload/concurrency isolation. Native formula-rich or subtotal reports remain unsupported.
- Validate vendor-native profiles, intermediate subtotal/hierarchy reconciliation, episodic scopes and localized numeric formats before adding them to the support matrix. The current CSV adapter rejects unsupported layouts rather than guessing.
- Wire authenticated host preview UI, entitlements, quotas, retention/deletion and transactional idempotency; add cross-tenant and end-to-end tests in TakeAgent. This repo alone does not deploy a production feature.
- Connect reviewed snapshots to finance review without treating cost measures as funding evidence. Costs alone cannot establish a financing or cash timing deficit.
- Live feeds require separate implementation and operational acceptance after vendor access is verified.

Tracked follow-up: [native profile validation](https://github.com/jongos/takeagent-wrapbook/issues/1) and [optional evaluation/API access](https://github.com/jongos/takeagent-wrapbook/issues/2).
