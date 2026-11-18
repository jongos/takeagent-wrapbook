import {readFile} from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';
import {previewCsv} from '../src/csv.js';
import {previewFile} from '../src/file.js';
test('documented synthetic fixture maps and reconciles',async()=>{
  const bytes=await readFile(new URL('../fixtures/synthetic-costs.csv',import.meta.url));
  const options=JSON.parse(await readFile(new URL('../fixtures/synthetic-options.json',import.meta.url),'utf8'));
  const p=previewCsv(bytes,options,{tenantId:'synthetic-tenant',projectId:'synthetic-project',currency:'USD',today:'2026-11-17'});
  assert.equal(p.totals.actuals,5000);assert.equal(p.totals.estimatedFinalCost,15500);assert.equal(p.rows[1].actuals,-525);
});
test('documented native provisional fixture maps and reconciles',async()=>{
  const bytes=await readFile(new URL('../fixtures/native-cost-detail-synthetic.csv',import.meta.url));
  const options=JSON.parse(await readFile(new URL('../fixtures/native-cost-detail-options.json',import.meta.url),'utf8'));
  const {snapshot}=await previewFile(bytes,options,{tenantId:'synthetic-tenant',projectId:'synthetic-project',currency:'USD',today:'2026-11-17'});
  assert.equal(snapshot.profile,'wrapbook-pas-cost-detail-csv-v1');
  assert.equal(snapshot.totals.estimatedFinalCost,1500000);
  assert.equal(snapshot.rows[0].lineId,'wrapbook-account:1100');
});
