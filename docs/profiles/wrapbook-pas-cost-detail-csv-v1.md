# Wrapbook PAS Detail Cost Report — native CSV profile (provisional)

**Profile id:** `wrapbook-pas-cost-detail-csv-v1`  
**Certification:** provisional (public documentation only; no attested vendor export in repo)

## Vendor scope

This profile targets a **Detail** PAS [cost report](https://help.wrapbook.com/v1/docs/cost-reports-pas) exported as **CSV (raw data)**. It is not for Cost Tracking exports, episodic-only layouts, combined summary/detail, or payroll worker-level reports. Payroll-related **account** lines may appear when they are part of the project chart of accounts in a standard detail cost report.

Wrapbook allows **renaming, reordering, and adding/removing columns** in the report UI. This profile accepts only the **default column names in default order** documented as of August 2026. Customized exports must use `wrapbook-pas-mapped-csv-v1` with explicit `reviewedMapping`.

## Column mapping

| Wrapbook default column | Snapshot field | Review gate |
| --- | --- | --- |
| `Budget` | `originalBudget` | Confirmed as original budget for the account |
| `Total budget` | `revisedBudget` | Includes approved overages when present in-product |
| `Actuals to date` | `actuals` | **Cumulative** actuals only |
| `POs` | `openCommitments` | **Remaining unpaid** PO obligations |
| `ETC` | `estimateToComplete` | Reported value; never inferred |
| `EFC` | `estimatedFinalCost` | Reported value; never inferred |
| `Description` | *(ignored)* | Allowed; never imported as an amount |

**Rejected if present:** `Period actuals`, `Total to date` (overlap cumulative actuals + PO semantics per adapter gates in `docs/pas-export-research.md`).

## Row layout

| Row | `Account` | Notes |
| --- | --- | --- |
| Detail | Non-empty account code | One row per leaf account; optional `Description` |
| Report total | Blank | Final row only; reconciles all six measures |

Account codes may include a trailing description token in the same cell (e.g. `1101 WRITER`); only the first whitespace-delimited token is used as the stable account id. Hierarchy/subtotal rows are **not** supported in this provisional profile.

## Stable identifiers for topsheet cross-walk

Each detail row includes:

- `lineId`: `wrapbook-account:<code>` — stable across revisions when the account code is unchanged
- `taxonomyBandHint` + `taxonomyBandHintSource`: provisional prefix rules (`provisional-prefix`) aligned to TakeAgent topsheet bands (`above-the-line`, `below-the-line`, `fringes`, `contingency`, `completion-bond`, `insurance`, `errors-omissions`, `completion-delivery`, `financing-cost`, `reserve`, `unclassified`)

Hints are **not** certified COA semantics and must not drive `finance.review` conclusions.

## Host options

```json
{
  "format": "csv",
  "profile": "wrapbook-pas-cost-detail-csv-v1",
  "completeForSelectedScope": true,
  "metadata": { "...": "same provenance contract as mapped CSV" }
}
```

`reviewedMapping` is not used. Metadata must still record `periodBasis`, `actualsBasis: cumulative`, and `commitmentBasis: remaining-unpaid-only` after user confirmation.

## What attestation would certify this profile

A user-attested export package should include:

1. CSV with **default** column names (screenshot of Report columns settings)
2. Confirmation of **Detail** report type (not episodic/combined)
3. Filter screenshot showing cumulative actuals basis (not period-only)
4. Effective-date / PO semantics confirmation for the selected period
5. Two revisions with a control-total row and at least one hierarchy or renamed-column counterexample if customization is used

Until then, the fixture `fixtures/native-cost-detail-synthetic.csv` is fully synthetic and proves parser behavior only.

## Funding boundary

The adapter returns `fundingGap: null` and `cashTimingGap: null`. Plan impact requires a separate user-approved map into `finance.review`.