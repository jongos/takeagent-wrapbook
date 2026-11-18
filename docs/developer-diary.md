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

## 2026-11-17 � Complete bounded interim file preview workflow

Added selected values-only XLSX parsing in a terminated, time/heap-bounded worker with ZIP/XML preflight and 2 MB serialized response cap. Explicit mapping and trusted scope feed the existing signed exact-money reconciliation. Numeric identifiers fail closed; provenance retains original cells. Added unified previewFile exports and a local no-write CLI. Pinned parser dependencies and CI installation/audit; documented official GL formula behavior and the deliberately narrow interim contract.

Validation: 72 tests passed locally, including hostile containers, formula caches, shared-string response amplification, numeric account identity, selection isolation, source offsets, scope mismatch and actual CLI execution. npm audit --omit=dev reports zero vulnerabilities. Native vendor exports, company/PAS access, live APIs and production host UI remain unverified; no deployment, vendor contact or real data used. Remote CI is a subsequent verification step.

## 2026-11-17 � Bound host preview presentation after full reconciliation

Resolved issue #3 with presentPreview and previewFileForHost. Full-data APIs remain unchanged. Presentation caps rows, findings and XLSX source-cell arrays; exposes complete counts and a presentation-only marker; enforces a 256 KB serialized ceiling. Documentation distinguishes this view from a complete import snapshot.

Validation: all 74 tests passed, including 10,000 rows / 20,000 findings, unchanged full totals/identity, bounded output, immutable source data, omitted-row reconciliation errors and oversized metadata rejection. No host deployment or vendor-native certification performed.

## 2026-11-17 — Record current optional host release

Added `docs/host-release-status.md` linking the deployed TakeAgent CSV/Excel release and explaining the division between shared host file handling and this adapter. Preserved optional installation, no-new-configuration behavior and vendor-access limitations. Refetched origin and verified the existing adapter source was already synchronized. The complete repository suite passed 74/74 tests. This commit changes documentation only; no adapter or deployment change is claimed.

## 2026-11-17 — Harden compare, bound findings, BOM CSV, single-pass XLSX, lint CI

Addressed open defect issues #4–#8 on branch `cursor/fix-open-code-defects-a0e4`. `compare()` now rejects mismatched `actualsBasis` and `commitmentBasis` and validates allowed enum values so tampered or drifting reporting basis cannot yield misleading zero deltas. `previewFile()` caps returned review findings at 100 with `totalFindingCount` and `findingsTruncated`; `presentPreview()` uses the full count for its truncation marker. CSV mapping strips one leading UTF-8 BOM after decode so Excel-saved headers match explicit mapping. XLSX preview uses the existing ZIP/XML validation pass only, with in-house shared-string and worksheet parsing; removed the `read-excel-file` dependency and second full parse. CI runs `npm run lint` via ESLint 9, pins `actions/checkout` and `actions/setup-node` to commit SHAs, and adds Dependabot for npm and GitHub Actions.

Validation: `npm run lint`, `npm test` (77/77), and `npm audit --omit=dev` (0 vulnerabilities) on Node 22 locally. Issues #1 and #2 remain blocked on authorized vendor synthetic exports and company/PAS API evaluation; no outreach or live credentials were used. Parallel open PR #9 contains the same code delta under a different branch name; coordinator should merge one branch only.

## 2026-11-17 — XLSX reader: formula strings, typed cells, entities, sparse addresses

Fixed review findings on PR #10 in `src/xlsx-reader.js`. Formula result cells with `t="str"` now commit cached text from `<v>` instead of waiting for inline `<is>` content. Boolean, date and error cell types (`b`, `d`, `e`) fail closed like the former `read-excel-file` path did for non-string values. Sheet lookup decodes XML entities in workbook `name` attributes before comparison. Missing `r` on `<c>` elements uses sequential column positions within the row for both archive inspection and extraction. Added eight XLSX regression tests covering those behaviors.

Validation: `npm run lint` and `npm test` (85/85) locally on Node 22.

## 2026-11-18 — Public release readiness scrub

Ran gitleaks (full history, `--all`), TruffleHog (`git file://`), and manual pattern scans; no credentials or keys in the working tree or git history. Fixtures remain synthetic. Updated outsider-facing README wording, package repository metadata, `.gitignore` local-artifact entries, and neutral phrasing for sign-in evaluation notes in `docs/blockers.md` and `docs/vendor-evaluation-request.md`. No LICENSE added (owner decision). Repository visibility unchanged.

Validation: `npm run lint`, `npm test`, and `npm audit --omit=dev` on Node 22 after fast-forwarding to `9e136eb`.
