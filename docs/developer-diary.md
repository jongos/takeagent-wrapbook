# Developer diary

## 2026-11-17 — Start read-only Wrapbook synthetic cost snapshot adapter

Created an isolated integration repository for TakeAgent issue #59. Added a strict mapped-row synthetic profile, exact decimal conversion, separate cost measures, control-total reconciliation, minimal row provenance, stable snapshot identity and guarded revision comparisons. This establishes a reviewable boundary before native export mappings are available. Official PAS documentation confirms configurable report columns; compatibility is therefore explicitly unverified.

Validation: `npm test` passes 15 tests covering credits/decimals, duplicate previews, revisions, tenant/project mismatches, unsupported currencies/profiles, missing values, sensitive columns, stale reports, reconciliation failure and invalid dates. No production deployment or live account verification occurred. Native CSV/XLSX parsing, authenticated host integration, persistence/idempotency, real report compatibility and partner API discovery remain follow-up work.

## 2026-11-17 — Bind preview currency and revision source to project context

Review found that a supported report currency could differ from the host project's currency. Preview now requires the explicit trusted context currency to match. Revision comparison also requires the stable sourceName to match, preventing unrelated source reports from being treated as revisions. Validation: all 17 tests pass, including missing/mismatched context currency and changed-source regressions. No deployment or native export validation occurred; prior integration limitations remain.

## 2026-11-17 — Add bounded CSV mapping and host integration contract

Added a dependency-free strict UTF-8 CSV reader with file/record/column/cell limits, explicit reviewed field mapping, completeness confirmation, source control totals, physical source rows, mapped column provenance and file SHA-256. Account paths preserve hierarchy and reject parent/detail double counting. Added an invented standalone fixture, build discovery manifest (development, live disabled), host integration contract, split vendor/user/engineering blockers, and Node 22/24 CI. Rechecked the official PAS cost-report documentation; customizable headers and filters require reviewed mapping, not a fixed unverified vendor schema.

Validation: 41 local tests pass, covering the complete synthetic CSV path, strict quoting/UTF-8, limits, malformed rows, formulas, mapping ambiguity, sensitive columns, reconciliation, project/currency boundaries, hierarchy and existing revisions. CI is configured but its remote result is not claimed in this entry. Native PAS/Cost Tracking compatibility, bounded XLSX extraction, authenticated TakeAgent UI/storage and production acceptance remain open. No live connectivity, customer data, credentials, vendor contact or deployment occurred.

## 2026-11-17 — Add cost consistency findings and account revision detail

Added source-linked cost consistency questions and account-level revision changes so offsetting account changes remain visible even when totals are unchanged. Findings preserve the separation between cost variance, financing availability and cash timing. Corrected the hierarchy ancestor guard to check every prefix rather than adjacent sorted paths; a lexical sibling could otherwise hide a parent/detail overlap.

Validation: 45 local tests pass including the hierarchy regression, account replacement, cost provenance, nonmutation and null financing/cash gap results. Hosted Node 22 and 24 CI passed for the preceding CSV commit 89c22e1 ([run](https://github.com/jongos/takeagent-wrapbook/actions/runs/44141825580)); this entry does not claim the new commit's remote result. Production host integration and native vendor/XLSX validation remain open; no deployment occurred.

## 2026-11-17 — Require complete hierarchy and expose path changes

Cross-review found mixed path/no-path rows could conceal parent/detail overlap, and unchanged amounts could conceal account hierarchy revisions. Preview now requires paths for every row when any path is supplied. Comparison returns previous/current paths and an explicit hierarchy-change flag. Validation: 47 local tests pass, including both regressions. No production or native export verification occurred; the existing documented blockers remain.

## 2026-11-17 — Record PAS evaluation boundary and export acceptance gates

Rechecked official company setup, PAS activation, reports, accounting integrations and documentation-index sources. The browser-test handoff confirms personal authentication and MFA but no assigned company/report role, PAS workspace or API controls. Recorded the exact unsent request for a synthetic PAS evaluation company or native export-only package, with optional supported API discovery kept separate. Added mapping cautions for cumulative versus period actuals, overlapping totals, combined GL detail and report filter scope. The manifest remains development/live-disabled and now names the company/PAS access gate.

Validation: all 51 synthetic tests pass, including four new report-boundary regressions. No native fixture, public API schema or self-service developer sandbox was located in the reviewed official sources; this does not rule out private partner access. No adapter behavior was broadened without evidence. No company onboarding, fee, payroll/worker workflow, vendor outreach, undocumented API probe or live adapter test occurred. Representative native exports or vendor-provided synthetic company access remain the next dependency.

## 2026-11-17 — Clarify personal free evaluation request

Narrowed the unsent vendor request to personal developer learning with synthetic data, a free time-limited environment or export-only package, and no ongoing corporate use, payroll operations or paid enrollment. This is documentation only; the preceding 51-test result remains applicable because no runtime or test source changed. Wording and diff checks passed. The request remains unsent and access remains unverified.
