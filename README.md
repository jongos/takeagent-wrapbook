# TakeAgent Wrapbook adapter spike

Private, read-only development for [TakeAgent issue #59](https://github.com/jongos/takeagent/issues/59). This repository implements bounded CSV mapping, synthetic cost-snapshot previews and revision comparisons. It does not connect to Wrapbook or modify TakeAgent projects. See `integration-manifest.json` for build discovery; live integration remains disabled.

Run `npm test` with Node 22 or newer. No dependencies or credentials are required. See the test fixture for the input contract. `preview(input, context)` validates a caller-selected project and tenant, currency, report basis and control totals, then returns distinct cost fields in integer minor units, row provenance, a deterministic identity and warnings. `compare` checks snapshot compatibility and reports cost changes without claiming a funding gap.

## Support matrix

| Source/profile | Status |
| --- | --- |
| `wrapbook-pas-synthetic-v1` mapped JSON rows | Tested synthetic contract only |
| `wrapbook-pas-mapped-csv-v1` explicitly mapped UTF-8 CSV | Tested with synthetic fixtures; no native vendor compatibility claim |
| Native PAS export profiles / XLSX | Not yet supported or verified |
| Cost Tracking exports | Not supported |
| PDF | Not parsed; future reconciliation evidence only |
| PO/GL merges and live API | Not implemented |

An integrating server must authenticate the caller and derive `context` from its authorized project, never from imported data. This library performs no persistence, networking, logging, or authentication. Its duplicate marker allows the host to skip imports; storage idempotency and tenant authorization require host implementation. Imported text must remain untrusted. Account descriptions and arbitrary columns are excluded. Caller-supplied provenance must not contain personal data.

## Mapping requirements and remaining work

The profile requires all six cost measures and explicit control totals. Missing fields fail rather than becoming zero. Credits are preserved. Actuals must be cumulative and commitments must be remaining unpaid obligations; no automatic PO/AP/payroll merge or EFC inference occurs. Only two-decimal USD/EUR/GBP/CAD/AUD are accepted; currency conversion is absent. One row per unique leaf account is required. Optional account paths preserve hierarchy; parent/detail mixtures are rejected. Episodic, summary/detail and multicurrency reports need further profiles. The caller must validate those semantics against the source report.

See [host contract](docs/host-contract.md) for the integration boundary and [blockers](docs/blockers.md) for vendor, user and engineering gates. Native export validation, XLSX extraction, authenticated host UI and production verification remain open.

## CSV preview

Import `previewCsv` from `src/csv.js`. Pass file bytes, options like `fixtures/synthetic-options.json`, and trusted host project context. `fixtures/synthetic-costs.csv` is an invented report, not an actual Wrapbook export. `reviewedMapping` and `completeForSelectedScope` must be true after user review. One final `total` row supplies source totals. No data is written.

The reader accepts UTF-8 comma-delimited CSV with strict quoting and CRLF/LF line endings. It bounds bytes (2 MB), records (10,002), columns (32), cell length (1,000) and detail rows (10,000). It rejects malformed input, extra columns, ambiguous mappings, formulas, localized amounts, duplicate accounts and unsupported row types without truncation. Source physical rows, mapped column numbers and file SHA-256 are included in the preview. Reordered columns work through explicit mapping.

## Research

[Wrapbook PAS cost reports](https://help.wrapbook.com/v1/docs/cost-reports-pas), reviewed November 17, 2026, documents CSV/XLSX/PDF exports and configurable report columns. Column names and ordering can change, so a fixed native schema cannot be assumed. Effective-date PO history and filters also affect interpretation. Public API access and partner terms remain unverified. No vendor contact, fees, credentials or deployment are part of this spike.

The trusted context must include the selected project's currency. sourceName is a stable source-report identity and must remain constant across revisions.

`compare` includes account-level additions/removals and deltas even when report totals stay unchanged. `costFindings` from `src/companion.js` returns source-linked questions for EFC above revised budget and actuals above EFC. It carries warnings forward and deliberately returns null funding/cash-timing gaps; cost data cannot establish those values.
