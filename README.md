# TakeAgent Wrapbook adapter spike

Read-only adapter spike for the [Wrapbook integration](https://takeagent.ai/integrations/wrapbook). This repository implements bounded CSV and values-only XLSX mapping, synthetic cost-snapshot previews and revision comparisons. It does not connect to Wrapbook or modify TakeAgent projects. See `integration-manifest.json` for build discovery; live integration remains disabled.

Run `npm ci` then `npm test` with Node 22 or newer. No credentials are required. See the test fixture for the input contract. `preview(input, context)` validates a caller-selected project and tenant, currency, report basis and control totals, then returns distinct cost fields in integer minor units, row provenance, a deterministic identity and warnings. `compare` checks snapshot compatibility and reports cost changes without claiming a funding deficit.

## Support matrix

| Source/profile | Status |
| --- | --- |
| `wrapbook-pas-synthetic-v1` mapped JSON rows | Tested synthetic contract only |
| `wrapbook-pas-mapped-csv-v1` explicitly mapped UTF-8 CSV | Tested with synthetic fixtures; no native vendor compatibility claim |
| `wrapbook-pas-mapped-xlsx-v1` selected values-only worksheet/range | Tested synthetic contract; explicit mapping required |
| `wrapbook-pas-cost-detail-csv-v1` PAS **Detail** cost report CSV (default columns) | **Provisional** ? matches [public PAS column defaults](https://help.wrapbook.com/v1/docs/cost-reports-pas); attested export required to certify |
| Cost Tracking exports | Not supported |
| PDF | Not parsed; future reconciliation evidence only |
| PO/GL merges and live API | Not implemented |

An integrating server must authenticate the caller and derive `context` from its authorized project, never from imported data. This library performs no persistence, networking, logging, or authentication. Its duplicate marker allows the host to skip imports; storage idempotency and tenant authorization require host implementation. Imported text must remain untrusted. Account descriptions and arbitrary columns are excluded. Caller-supplied provenance must not contain personal data.

## Mapping requirements and remaining work

The profile requires all six cost measures and explicit control totals. Missing fields fail rather than becoming zero. Credits are preserved. Actuals must be cumulative and commitments must be remaining unpaid obligations; no automatic PO/AP/payroll merge or EFC inference occurs. Only two-decimal USD/EUR/GBP/CAD/AUD are accepted; currency conversion is absent. One row per unique leaf account is required. Optional account paths preserve hierarchy; parent/detail mixtures are rejected. Episodic, summary/detail and multicurrency reports need further profiles. The caller must validate those semantics against the source report.

See [host contract](docs/host-contract.md) for the integration boundary, [native profile doc](docs/profiles/wrapbook-pas-cost-detail-csv-v1.md) for column mapping, and [PROVENANCE.md](PROVENANCE.md) for host pin identifiers. [blockers](docs/blockers.md) lists remaining vendor and engineering gates.

The [evaluation request](docs/vendor-evaluation-request.md) specifies the minimum synthetic PAS workspace or native export package needed next; [PAS mapping research](docs/pas-export-research.md) records field and report-scope distinctions. Personal login alone does not supply company/PAS or API access.

## CSV preview

Import `previewCsv` from `src/csv.js`. Pass file bytes, options like `fixtures/synthetic-options.json`, and trusted host project context. `fixtures/synthetic-costs.csv` is an invented report, not an actual Wrapbook export. `reviewedMapping` and `completeForSelectedScope` must be true after user review. One final `total` row supplies source totals. No data is written.

The reader accepts UTF-8 comma-delimited CSV with strict quoting and CRLF/LF line endings. It bounds bytes (2 MB), records (10,002), columns (32), cell length (1,000) and detail rows (10,000). It rejects malformed input, extra columns, ambiguous mappings, formulas, localized amounts, duplicate accounts and unsupported row types without truncation. Source physical rows, mapped column numbers and file SHA-256 are included in the preview. Reordered columns work through explicit mapping.

## Research

[Wrapbook PAS cost reports](https://help.wrapbook.com/v1/docs/cost-reports-pas), reviewed November 17, 2026, documents CSV/XLSX/PDF exports and configurable report columns. Column names and ordering can change, so a fixed native schema cannot be assumed. Effective-date PO history and filters also affect interpretation. Public API access and partner terms remain unverified. No vendor contact, fees, credentials or deployment are part of this spike.

The trusted context must include the selected project's currency. sourceName is a stable source-report identity and must remain constant across revisions.

`compare` includes account-level additions/removals and deltas even when report totals stay unchanged. `costFindings` from `src/companion.js` returns source-linked questions for EFC above revised budget and actuals above EFC. It carries warnings forward and deliberately returns null `fundingDeficit` and `cashTimingDeficit` values (legacy `fundingGap` and `cashTimingGap` keys are deprecated aliases with identical values); cost data cannot establish financing or cash-timing deficits.

## Complete interim file workflow

The interim deliverable is a local/server-side read-only file preview, reconciliation, provenance and comparison library. It is ready for mapped synthetic inputs; it is not a live Wrapbook connection or a deployed TakeAgent upload feature.

```js
import {readFile} from 'node:fs/promises';
import {previewFile} from './src/index.js';
const options = JSON.parse(await readFile('fixtures/synthetic-options.json', 'utf8'));
const context = JSON.parse(await readFile('fixtures/synthetic-context.json', 'utf8'));
const {snapshot, review} = await previewFile(await readFile('fixtures/synthetic-costs.csv'), options, context);
console.log(snapshot.totals, review);
```

Runnable local example: `node bin/preview.mjs fixtures/synthetic-costs.csv fixtures/synthetic-options.json fixtures/synthetic-context.json`. For the provisional native layout: `node bin/preview.mjs fixtures/native-cost-detail-synthetic.csv fixtures/native-cost-detail-options.json fixtures/synthetic-context.json`. The CLI writes JSON to stdout and changes no files. The context fixture is synthetic; a host must construct trusted authorized context itself.

For XLSX, use `format: "xlsx"`, `profile: "wrapbook-pas-mapped-xlsx-v1"`, exact `sheet` name and `range: {startRow: 1, endRow: 4, startColumn: 1, endColumn: 9}` with the same mapping/metadata contract. Selected range must contain a header, detail rows and final control total. Account/hierarchy/row-type identifiers must be stored as text; numeric IDs are rejected to avoid losing displayed leading zeroes. Amounts preserve raw decimal text, not Excel formatted display. No locale conversion or formula calculation occurs.

The worker bounds input to 2 MB, archive expansion to 15 MB, individual parts to 8 MB, 150 entries, five sheets, 10,002 rows, 32 columns and 1,000 characters per cell; selected serialized output is capped at 2 MB. It has a 10-second timeout and bounded V8 heap. Worker termination is awaited. The whole workbook is checked for formulas (including cached values), hidden content, merged cells, external links, macros and other active content; these are rejected, even on unselected sheets. Only the selected range is returned, with original cell addresses and file SHA-256. This restrictive subset is intentional. Host process/upload/concurrency isolation is still required.

[Official GL report documentation](https://help.wrapbook.com/docs/general-ledger-reports-pas), reviewed November 17, 2026, describes formulas/subtotals in XLSX and raw CSV export. Such GL workbooks are outside this values-only contract. No public downloadable native PAS cost-report sample was located in the official documentation reviewed; our XLSX fixtures are generated synthetic containers, not certified vendor exports.

## Bounded host responses

Use `await previewFileForHost(bytes, options, trustedContext)` from the root exports for HTTP/UI previews. It validates and reconciles the complete report first, then returns at most 30 rows, findings and XLSX cell-provenance records (optional `{limit}` 1–100 as fourth argument). Full totals and identity are preserved; `totalRowCount`, `totalFindingCount`, `truncated` and `presentationOnly: true` explicitly describe the view. Serialized output cannot exceed 256,000 UTF-8 bytes; unusually large metadata fails visibly. `presentPreview(fullResult, {limit})` presents an already validated full result.

Keep the original full result for comparison/import logic; never pass truncated presentation rows to `compare` or persist them as a complete snapshot. `previewFile` remains the complete-data API. The host must still authenticate, remove private scope identifiers where appropriate and enforce request/concurrency limits.

## License

Licensed under the MediaHedge License. Use is permitted only as allowed by the TakeAgent Terms of Service at https://takeagent.ai/terms. See LICENSE.
