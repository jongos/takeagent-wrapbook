# PAS export research and mapping gates

Official documentation rechecked November 17, 2026. These are review cues, not a native schema certification.

The [PAS cost-report guide](https://help.wrapbook.com/v1/docs/cost-reports-pas) documents CSV/XLSX/PDF, configurable column names/order, cumulative and period actuals, PO figures, ETC/EFC and budget figures. Effective-date filters differ from posted-date filters. Historical PO status before July 24, 2026 has a documented limitation; ask whether it affects the intended report. Currency selection and account/location filters must be preserved as scope, not dropped during mapping.

| Report concept | Adapter review gate |
| --- | --- |
| Actuals to date versus period actuals | Only confirmed cumulative actuals map to actuals. |
| POs | Confirm remaining unpaid obligations without overlap with actuals. |
| Total to date | Never add it to actuals and commitments; it overlaps those measures. |
| Budget and Total budget | Confirm original/revised meanings; missing original history must not become zero. |
| ETC and EFC | Preserve reported values separately; do not infer missing figures. |
| Account hierarchy and totals | Map unique leaf accounts; exclude parent/subtotal duplication and retain controls. |

The [Cost Report Bible](https://www.wrapbook.com/blog/new-cost-report-bible-wrapbook-product-updates) combines report and posted GL detail. It is not accepted as one flat account table; doing so could duplicate costs. The [reports directory](https://help.wrapbook.com/docs/reports-index) distinguishes PAS from Cost Tracking and payroll reports. None is interchangeable without a verified profile.

No public downloadable native fixture or API schema was located in this review. Profile `wrapbook-pas-cost-detail-csv-v1` encodes the **default** Detail CSV column names from the PAS guide; certification stays **provisional** until a user-attested export confirms layout, filters, and totals. See [profile mapping](profiles/wrapbook-pas-cost-detail-csv-v1.md) and [exact evaluation request](vendor-evaluation-request.md).
