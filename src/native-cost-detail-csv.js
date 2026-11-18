import { createHash } from 'node:crypto';
import { fields, preview } from './index.js';
import { parseCsv } from './csv.js';
import { lineIdForAccount, provisionalTaxonomyBandHint } from './taxonomy.js';

export const NATIVE_PROFILE = 'wrapbook-pas-cost-detail-csv-v1';

export const nativeCostDetailProfileDefinition = Object.freeze({
  id: NATIVE_PROFILE,
  certification: 'provisional',
  format: 'csv',
  reportType: 'pas-cost-detail',
});

/** Default PAS detail cost-report columns per Wrapbook help docs (Nov 2026); users may rename in-product. */
export const nativeHeaders = Object.freeze({
  account: 'Account',
  description: 'Description',
  originalBudget: 'Budget',
  revisedBudget: 'Total budget',
  actuals: 'Actuals to date',
  openCommitments: 'POs',
  estimateToComplete: 'ETC',
  estimatedFinalCost: 'EFC',
});

const forbiddenNativeHeaders = new Set([
  'Period actuals',
  'Total to date',
  'Period variance',
  '% complete',
]);

const measureHeaderList = [
  nativeHeaders.originalBudget,
  nativeHeaders.revisedBudget,
  nativeHeaders.actuals,
  nativeHeaders.openCommitments,
  nativeHeaders.estimateToComplete,
  nativeHeaders.estimatedFinalCost,
];

function reject(message) {
  throw new Error(message);
}

function accountCode(raw) {
  if (typeof raw !== 'string' || !raw.trim()) return '';
  const token = raw.trim().split(/\s+/)[0];
  if (!/^[A-Za-z0-9._-]{1,40}$/.test(token)) reject('Invalid account code in native export');
  return token;
}

/** Parse Wrapbook PAS Detail cost report CSV with vendor-default column names (provisional certification). */
export function previewNativePasCostDetailCsv(bytes, options, context) {
  if (options?.profile !== NATIVE_PROFILE) reject('Unsupported native profile');
  if (options.completeForSelectedScope !== true) reject('Confirm report completeness for the selected scope');
  const { headers, records } = parseCsv(bytes);
  for (const forbidden of forbiddenNativeHeaders) {
    if (headers.includes(forbidden)) reject(`Column "${forbidden}" is incompatible with cumulative/remaining-unpaid mapping`);
  }
  const optionalDescription = headers.includes(nativeHeaders.description);
  const expected = optionalDescription
    ? [nativeHeaders.account, nativeHeaders.description, ...measureHeaderList]
    : [nativeHeaders.account, ...measureHeaderList];
  if (headers.length !== expected.length || headers.some((h, i) => h !== expected[i])) {
    reject('Native profile requires default PAS detail column names and order, or use wrapbook-pas-mapped-csv-v1');
  }
  const columns = Object.fromEntries([nativeHeaders.account, ...measureHeaderList].map((h) => [h, headers.indexOf(h)]));
  const amountColumns = Object.fromEntries(
    [
      ['originalBudget', nativeHeaders.originalBudget],
      ['revisedBudget', nativeHeaders.revisedBudget],
      ['actuals', nativeHeaders.actuals],
      ['openCommitments', nativeHeaders.openCommitments],
      ['estimateToComplete', nativeHeaders.estimateToComplete],
      ['estimatedFinalCost', nativeHeaders.estimatedFinalCost],
    ].map(([k, h]) => [k, columns[h]]),
  );
  const rows = [];
  let controlTotals;
  let totalRow;
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const cell = (h) => record.cells[columns[h]];
    const code = accountCode(cell(nativeHeaders.account));
    const isLast = i === records.length - 1;
    if (!code) {
      if (!isLast) reject('Blank account rows are only accepted on the final report total');
      const amounts = Object.fromEntries(fields.map((k) => [k, record.cells[amountColumns[k]]]));
      if (controlTotals) reject('One final report total row is required');
      controlTotals = amounts;
      totalRow = record.sourceRow;
      continue;
    }
    const amounts = Object.fromEntries(fields.map((k) => [k, record.cells[amountColumns[k]]]));
    const { band, source } = provisionalTaxonomyBandHint(code);
    rows.push({
      account: code,
      ...amounts,
      sourceRow: record.sourceRow,
      lineId: lineIdForAccount(code),
      taxonomyBandHint: band,
      taxonomyBandHintSource: source,
    });
  }
  if (!controlTotals) reject('Missing source control total');
  const result = preview(
    {
      profile: NATIVE_PROFILE,
      metadata: options.metadata,
      rows,
      controlTotals,
    },
    context,
  );
  const source = {
    format: 'csv',
    profile: NATIVE_PROFILE,
    certification: 'provisional',
    sha256: createHash('sha256').update(bytes).digest('hex'),
    columns: Object.fromEntries(
      [...Object.entries(amountColumns), ['account', columns[nativeHeaders.account]]].map(([k, v]) => [k, v + 1]),
    ),
    totalRow,
    vendorDoc: 'https://help.wrapbook.com/v1/docs/cost-reports-pas',
  };
  return {
    ...result,
    source,
    profileCertification: nativeCostDetailProfileDefinition.certification,
    profileMeta: {
      certification: nativeCostDetailProfileDefinition.certification,
      reportType: nativeCostDetailProfileDefinition.reportType,
      columnLayout: 'vendor-default-2026-08',
      attestationRequired:
        'User-attested CSV export with default column names, Detail report type, cumulative actuals and remaining PO semantics.',
    },
    warnings: [
      ...result.warnings.filter((w) => !w.startsWith('Synthetic profile')),
      'Provisional native profile: column names match public Wrapbook PAS documentation; renamed or customized exports need mapped-csv.',
      'Taxonomy band hints use provisional account-prefix rules only; not a certified chart-of-accounts map.',
    ],
  };
}