# Wrapbook evaluation access: exact next request

Reviewed November 17, 2026. This is an unsent technical request, not an assertion that Wrapbook offers a developer sandbox or API.

## Access evidence and present boundary

A manual sign-in check reported successful personal sign-in, MFA enabled and no assigned role, followed by a logged-in screen without a company, PAS workspace or API controls. The welcome page directs company setup through the Wrapbook team. That verifies personal authentication only. Company-detail, setup-fee and payroll/insurance onboarding options were not used. No company data, report export or vendor API request was tested.

Wrapbook documents a team-assisted company setup followed by an invitation. PAS activation requires its Customer Success Manager or Support, and reporting access depends on roles. These are separate from a personal login. [Company setup](https://help.wrapbook.com/docs/about-companies), [PAS activation](https://help.wrapbook.com/docs/about-production-accounting), [report access](https://help.wrapbook.com/docs/reports-index).

Official-domain searches and the [public documentation index](https://help.wrapbook.com/llms.txt) did not reveal a self-service developer sandbox, an API authentication/reference contract, or downloadable native PAS sample exports. This does not establish that private partner access is unavailable. Existing [accounting integrations](https://help.wrapbook.com/docs/accounting-integrations) describe supported product connections, not a general third-party API entitlement.

## Minimum request — file evaluation first

> I am requesting a personal developer evaluation to learn Wrapbook's report schemas using synthetic data and test a read-only TakeAgent prototype. This is not a request for ongoing corporate use, a production company account or payroll services. Is there a free, time-limited evaluation environment with PAS enabled and one synthetic project, or can you provide native synthetic exports without provisioning a company?
>
> For an evaluation environment, please invite my existing personal account with the least privilege needed to view and export that synthetic project's cost reports. No worker onboarding, payroll processing, bank setup, production funds or access to other companies is needed. Please confirm the free evaluation period and that operational onboarding and setup fees are not required. If there is no free evaluation route, the synthetic export-only package is sufficient for this stage; no paid enrollment is authorized.
>
> For the export-only route, please provide the same synthetic single-budget detail cost report as CSV and XLSX, plus a PDF control copy with report settings and filters visible. Include two report revisions, a negative adjustment, a zero-balance account, account hierarchy and source totals. Please identify the export/profile version, currency/FX basis, as-of/effective date, selected filters, and definitions of Budget, Total budget, Actuals to date, POs, ETC and EFC. Confirm whether original and revised budgets are both available and whether POs represent only obligations not already counted in actuals. Include no personal, bank or worker-level data.

Either route unlocks native-format validation. It does not require an API key. A company invitation without PAS/report permissions is insufficient.

## Optional request — live API discovery only

> For this personal, synthetic-data evaluation, is there a free, time-limited supported third-party read-only API sandbox or partner feed for selected-project budget/cost snapshots? If so, please provide the official sandbox base URL, versioned API specification, authentication method, minimum project/report scopes, synthetic test tenant, pagination rules, rate limits, revision/deletion semantics, revocation process and evaluation terms. Please confirm an unattended server-to-server access method rather than relying on a personal browser/MFA session. Only account-level budget, actual, unpaid-commitment, ETC/EFC and report metadata are needed; no payment, payroll, bank or worker endpoints. Ongoing corporate or commercial use would require a separate discussion and authorization.

No API addresses or credentials should be guessed from browser traffic. A working personal session is not API authorization. Keep liveEnabled=false until a supported route and customer authorization are verified.

## Next acceptance run when access arrives

1. Record the authorized synthetic company/project and supported report profile; verify that unrelated projects are inaccessible.
2. Export the two revisions with identical scope and explicit settings; preserve the originals and SHA-256 hashes as test evidence.
3. Confirm every field's meaning, map leaf accounts, reconcile account and grand totals, and compare revisions without financing-plan writes. Exclude period actuals and combined transaction detail from cumulative-account totals.
4. Test missing fields, credits, stale/effective dates, duplicate imports, scope changes and revoked access. XLSX needs bounded extraction before acceptance.
5. Document verified compatibility separately from synthetic parser tests. No live integration or funding conclusions follow merely from a reconciled export.

No message was sent, no company was created, and no employment/payroll workflow was started during this research.
