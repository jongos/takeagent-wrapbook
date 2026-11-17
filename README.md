# TakeAgent Wrapbook adapter spike

Private, read-only development for [TakeAgent issue #59](https://github.com/jongos/takeagent/issues/59). This repository implements a synthetic mapped-row preview and comparison boundary. It does not connect to Wrapbook or modify TakeAgent projects.

Run `npm test` with Node 22 or newer. No dependencies or credentials are required. See the test fixture for the input contract. `preview(input, context)` validates a caller-selected project and tenant, currency, report basis and control totals, then returns distinct cost fields in integer minor units, row provenance, a deterministic identity and warnings. `compare` checks snapshot compatibility and reports cost changes without claiming a funding gap.

## Support matrix

| Source/profile | Status |
| --- | --- |
| `wrapbook-pas-synthetic-v1` mapped JSON rows | Tested synthetic contract only |
| Native PAS CSV/XLSX | Not yet supported or verified |
| Cost Tracking exports | Not supported |
| PDF | Not parsed; future reconciliation evidence only |
| PO/GL merges and live API | Not implemented |

An integrating server must authenticate the caller and derive `context` from its authorized project, never from imported data. This library performs no persistence, networking, logging, or authentication. Its duplicate marker allows the host to skip imports; storage idempotency and tenant authorization require host implementation. Imported text must remain untrusted. Account descriptions and arbitrary columns are excluded. Caller-supplied provenance must not contain personal data.

## Mapping requirements and remaining work

The profile requires all six cost measures and separately supplied control totals. Missing fields fail rather than becoming zero. Credits are preserved. Actuals must be cumulative and commitments must be remaining unpaid obligations; no automatic PO/AP/payroll merge or EFC inference occurs. Only two-decimal USD/EUR/GBP/CAD/AUD are accepted; currency conversion is absent. One row per unique leaf account is required; hierarchical, episodic, summary/detail and multicurrency reports need further profiles. The caller must validate those semantics against the source report.

Next: obtain synthetic representative native exports; implement bounded CSV/XLSX parsing and a reviewed mapping preview; reconcile account hierarchy and filters; connect previews to existing TakeAgent document/finance services; add authenticated project selection and explicit apply controls if persistence is introduced. No live integration or production readiness is claimed.

## Research

[Wrapbook PAS cost reports](https://help.wrapbook.com/v1/docs/cost-reports-pas), reviewed November 17, 2026, documents CSV/XLSX/PDF exports and configurable report columns. Column names and ordering can change, so a fixed native schema cannot be assumed. Effective-date PO history and filters also affect interpretation. Public API access and partner terms remain unverified. No vendor contact, fees, credentials or deployment are part of this spike.

The trusted context must include the selected project's currency. sourceName is a stable source-report identity and must remain constant across revisions.
