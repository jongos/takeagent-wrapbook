import { readFile } from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';
import { previewNativePasCostDetailCsv, NATIVE_PROFILE, nativeHeaders } from '../src/native-cost-detail-csv.js';
import { previewFile } from '../src/file.js';
import { costFindings } from '../src/companion.js';
import { NATIVE_COST_DETAIL_PROFILE } from '../src/index.js';

const ctx = { tenantId: 'synthetic-tenant', projectId: 'synthetic-project', currency: 'USD', today: '2026-11-17' };
const encode = (s) => new TextEncoder().encode(s);
const measureHeaders = [
  nativeHeaders.originalBudget,
  nativeHeaders.revisedBudget,
  nativeHeaders.actuals,
  nativeHeaders.openCommitments,
  nativeHeaders.estimateToComplete,
  nativeHeaders.estimatedFinalCost,
];

function options(overrides = {}) {
  return {
    profile: NATIVE_PROFILE,
    completeForSelectedScope: true,
    metadata: {
      ...ctx,
      revision: '1',
      sourceName: 'synthetic-native',
      periodBasis: 'detail;cumulative',
      asOf: '2026-11-01',
      commitmentBasis: 'remaining-unpaid-only',
      actualsBasis: 'cumulative',
      currency: 'USD',
    },
    ...overrides,
  };
}

function nativeCsv({ description = true, amounts } = {}) {
  const header = description
    ? [nativeHeaders.account, nativeHeaders.description, ...measureHeaders]
    : [nativeHeaders.account, ...measureHeaders];
  const a = amounts ?? ['10000.00', '10500.00', '5500.25', '1000.00', '5000.75', '10500.00'];
  const b = amounts ? null : ['5000.00', '4500.00', '2000.00', '500.00', '2500.00', '4500.00'];
  const t = amounts
    ? ['', '', '10000.00', '10500.00', '5500.25', '1000.00', '5000.75', '10500.00']
    : ['', 'Report total', '15000.00', '15000.00', '7500.25', '1500.00', '7500.75', '15000.00'];
  const detailA = description ? ['1100', 'Synth line A', ...a] : ['1100', ...a];
  const detailB = b && (description ? ['2100', 'Synth line B', ...b] : ['2100', ...b]);
  return [header.join(','), detailA.join(','), ...(detailB ? [detailB.join(',')] : []), t.join(',')].join('\n');
}

test('native PAS detail CSV maps vendor-default columns into fingerprinted snapshot', async () => {
  const bytes = await readFile(new URL('../fixtures/native-cost-detail-synthetic.csv', import.meta.url));
  const fileOptions = JSON.parse(
    await readFile(new URL('../fixtures/native-cost-detail-options.json', import.meta.url), 'utf8'),
  );
  const { snapshot, review } = await previewFile(bytes, fileOptions, ctx);
  assert.equal(snapshot.profile, NATIVE_COST_DETAIL_PROFILE);
  assert.equal(snapshot.totals.actuals, 750025);
  assert.equal(snapshot.rows[0].lineId, 'wrapbook-account:1100');
  assert.equal(snapshot.rows[0].taxonomyBandHint, 'above-the-line');
  assert.equal(snapshot.profileMeta.certification, 'provisional');
  assert.equal(review.fundingGap, null);
  assert.equal(review.cashTimingGap, null);
  assert.equal(review.fundingDeficit, null);
  assert.equal(review.cashTimingDeficit, null);
  assert.equal(snapshot.profileCertification, 'provisional');
  assert.equal(review.findings.some((f) => f.code === 'PROVISIONAL_VENDOR_PROFILE'), true);
  assert.match(snapshot.warnings.join(' '), /Provisional native/);
});

test('documented native fixture reconciles and exposes stable line ids', async () => {
  const p = previewNativePasCostDetailCsv(
    await readFile(new URL('../fixtures/native-cost-detail-synthetic.csv', import.meta.url)),
    options(),
    ctx,
  );
  assert.equal(p.source.totalRow, 4);
  assert.equal(p.rows[1].taxonomyBandHint, 'below-the-line');
  assert.equal(p.id.length, 64);
});

test('rejects Period actuals and Total to date columns', () => {
  const bad = `${nativeCsv()}\n`.replace(
    'Actuals to date',
    'Period actuals',
  );
  assert.throws(() => previewNativePasCostDetailCsv(encode(bad), options(), ctx), /incompatible/i);
  const bad2 = nativeCsv().replace('POs', 'Total to date');
  assert.throws(() => previewNativePasCostDetailCsv(encode(bad2), options(), ctx), /incompatible|Native profile/);
});

test('renamed columns require mapped profile', () => {
  const renamed = nativeCsv().replaceAll('Actuals to date', 'Cumulative actuals');
  assert.throws(() => previewNativePasCostDetailCsv(encode(renamed), options(), ctx), /Native profile requires/);
});

test('cost findings carry lineId without funding deficit', () => {
  const amounts = ['100.00', '100.00', '10.00', '0.00', '100.00', '110.00'];
  const header = [nativeHeaders.account, nativeHeaders.description, ...measureHeaders].join(',');
  const detail = ['1101', 'Synth overrun', ...amounts].join(',');
  const total = ['', 'Report total', ...amounts].join(',');
  const csv = [header, detail, total].join('\n');
  const p = previewNativePasCostDetailCsv(encode(csv), options(), ctx);
  const f = costFindings(p);
  assert.equal(f.findings.some((x) => x.code === 'PROVISIONAL_VENDOR_PROFILE'), true);
  const overrun = f.findings.find((x) => x.code === 'EFC_ABOVE_REVISED_BUDGET');
  assert.equal(overrun.lineId, 'wrapbook-account:1101');
  assert.equal(f.fundingGap, null);
  assert.equal(f.fundingDeficit, null);
  assert.equal(f.cashTimingDeficit, null);
});

test('account token with description suffix parses leaf code', () => {
  const csv = nativeCsv().replace('1100,Synth line A', '1101 SYNTH,Synth line A').replace('2100,Synth line B', '2101 SYNTH,Synth line B');
  const p = previewNativePasCostDetailCsv(encode(csv), options(), ctx);
  assert.equal(p.rows[0].account, '1101');
});