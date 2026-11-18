# Vendor pin provenance

| Field | Value |
| --- | --- |
| Adapter repository | [jongos/takeagent-wrapbook](https://github.com/jongos/takeagent-wrapbook) |
| Host integration | Authorized production-planning host that vendors adapter libraries and runs finance review separately from cost import |
| Build brief item | Native exports (section 6) — Wrapbook leg |

## Certified / provisional profiles

| Profile id | Format | Status | Fixture |
| --- | --- | --- | --- |
| `wrapbook-pas-synthetic-v1` | JSON rows (internal) | Test contract only | via mapped importers |
| `wrapbook-pas-mapped-csv-v1` | CSV | Tested; not vendor-native | `fixtures/synthetic-costs.csv` |
| `wrapbook-pas-mapped-xlsx-v1` | XLSX | Tested; not vendor-native | `tests/helpers/xlsx-fixture.js` |
| `wrapbook-pas-cost-detail-csv-v1` | CSV | **Provisional** native layout | `fixtures/native-cost-detail-synthetic.csv` |

## Documentation basis (public)

- [Cost reports (PAS)](https://help.wrapbook.com/v1/docs/cost-reports-pas) — reviewed November 2026 for default column names and export formats
- [PAS export research](docs/pas-export-research.md) — measure interpretation gates

No live Wrapbook API, credentials, or production export samples are stored in this repository.

## Host vendoring identifiers

When pinning this package into the host application, register:

- Integration id: `wrapbook` (`integration-manifest.json`)
- Native export profile: `wrapbook-pas-cost-detail-csv-v1`
- Mapped fallback profiles: `wrapbook-pas-mapped-csv-v1`, `wrapbook-pas-mapped-xlsx-v1`
- Internal snapshot profiles: `wrapbook-pas-synthetic-v1` (parser output only)

Funding interpretation remains in host `finance.review`; adapters refuse to infer funding gaps from cost snapshots alone.