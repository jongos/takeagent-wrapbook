import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {previewCsv} from '../src/csv.js';
import {compare} from '../src/index.js';
const context={tenantId:'synthetic-tenant',projectId:'synthetic-project',currency:'USD',today:'2026-11-17'};
async function fixture(){return {text:await readFile(new URL('../fixtures/synthetic-costs.csv',import.meta.url),'utf8'),options:JSON.parse(await readFile(new URL('../fixtures/synthetic-options.json',import.meta.url),'utf8'))};}
const bytes=text=>new TextEncoder().encode(text);
test('period actuals are not silently substituted for the mapped cumulative column',async()=>{const {text,options}=await fixture();assert.throws(()=>previewCsv(bytes(text.replace('Actuals','Period actuals')),options,context),/Missing mapped column/);});
test('total-to-date overlap cannot enter the selected account table as an extra amount',async()=>{const {text,options}=await fixture();const extended=text.trimEnd().split(/\r?\n/).map((line,index)=>line+','+(index?'65.00':'Total to date')).join('\n');assert.throws(()=>previewCsv(bytes(extended),options,context),/unrelated columns/);});
test('combined cost report and GL detail cannot be flattened into the account profile',async()=>{const {text,options}=await fixture();const combined=text.trimEnd()+'\nPosting date,Account,Debit,Credit\n2026-11-01,1100,55.25,0\n';assert.throws(()=>previewCsv(bytes(combined),options,context),/Ragged/);});
test('different report filter scope cannot be treated as a new revision',async()=>{const {text,options}=await fixture();const before=previewCsv(bytes(text),options,context);const changed=structuredClone(options);changed.metadata.revision='r2';changed.metadata.periodBasis='cumulative;selected-account-1100;effective-through-2026-11-01';const after=previewCsv(bytes(text),changed,context);assert.throws(()=>compare(before,after),/Incompatible/);});
