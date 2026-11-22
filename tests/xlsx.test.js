import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {previewXlsx,xlsxLimits} from '../src/xlsx.js';
import {previewFile} from '../src/file.js';
import {workbook} from './helpers/xlsx-fixture.js';
const base=JSON.parse(await readFile(new URL('../fixtures/synthetic-options.json',import.meta.url),'utf8'));
const options={...base,profile:'wrapbook-pas-mapped-xlsx-v1',sheet:'Synthetic costs',range:{startRow:1,endRow:4,startColumn:1,endColumn:9}};
const context={tenantId:'synthetic-tenant',projectId:'synthetic-project',currency:'USD',today:'2026-11-17'};
test('selected XLSX values retain exact signed cents and original cell provenance',async()=>{const p=await previewXlsx(workbook(),options,context);assert.equal(p.totals.actuals,5000);assert.equal(p.rows[1].actuals,-525);assert.equal(p.source.cells[1].references.actuals,'F3');assert.equal(p.source.sheet,'Synthetic costs');assert.equal(p.source.format,'xlsx');assert.equal(p.source.totalRow,4);});
test('selected offset range preserves Excel addresses and excludes unselected cells',async()=>{const p=await previewXlsx(workbook({rowOffset:2,columnOffset:1}),{...options,range:{startRow:3,endRow:6,startColumn:2,endColumn:10}},context);assert.equal(p.rows[0].sourceRow,4);assert.equal(p.source.cells[0].references.actuals,'G4');assert.equal(p.source.totalRow,6);});
test('unified file preview supplies read-only companion and does not mutate trusted context',async()=>{const before=structuredClone(context);const result=await previewFile(workbook(),{...options,format:'xlsx'},context);assert.equal(result.readOnly,true);assert.equal(result.review.fundingGap,null);assert.equal(result.review.fundingDeficit,null);assert.equal(result.review.cashTimingDeficit,null);assert.equal(result.snapshot.totals.estimatedFinalCost,15500);assert.deepEqual(context,before);});
test('XLSX requires explicit reviewed sheet/range and project scope',async()=>{for(const changed of [{sheet:'missing'},{range:null},{range:{startRow:1,endRow:10003,startColumn:1,endColumn:9}},{reviewedMapping:false}])await assert.rejects(previewXlsx(workbook(),{...options,...changed},context));await assert.rejects(previewXlsx(workbook(),options,{...context,projectId:'other'}),/mismatch/);});
for(const [name,changeSheet] of Object.entries({formula:xml=>xml.replace('<v>55.25</v>','<f>55+0.25</f><v>55.25</v>'),merged:xml=>xml.replace('</worksheet>','<mergeCells><mergeCell ref="A1:B1"/></mergeCells></worksheet>'),hidden:xml=>xml.replace('<row r="2">','<row r="2" hidden="1">'),duplicateCell:xml=>xml.replace('<c r="B2"','<c r="A2"'),sparse:xml=>xml.replace('A1:I4','A1:XFD1048576'),doctype:xml=>'<!DOCTYPE worksheet [<!ENTITY x "bad">]>'+xml,precision:xml=>xml.replace('55.25','55.251'),missing:xml=>xml.replace('<v>55.25</v>','')}))test(`XLSX rejects ${name} without using cached or guessed values`,async()=>assert.rejects(previewXlsx(workbook({changeSheet}),options,context)));
test('XLSX rejects macros, external relationships and compressed expansion',async()=>{for(const extra of [{'xl/vbaProject.bin':'test'},{'xl/unsafe.xml':'<Relationships><Relationship TargetMode="External" Target="https://example.test/private"/></Relationships>'},{'xl/bomb.xml':'<x>'+'a'.repeat(300000)+'</x>'}])await assert.rejects(previewXlsx(workbook({extra}),options,context));});
test('XLSX rejects oversize, encrypted and non-workbook input',async()=>{await assert.rejects(previewXlsx(Buffer.alloc(xlsxLimits.compressed+1),options,context));await assert.rejects(previewXlsx(Buffer.from('not xlsx'),options,context));const encrypted=workbook();for(let i=0;i<encrypted.length-4;i++)if(encrypted.readUInt32LE(i)===0x02014b50)encrypted.writeUInt16LE(encrypted.readUInt16LE(i+8)|1,i+8);await assert.rejects(previewXlsx(encrypted,options,context),/ENCRYPTED/);});
test('hidden sheets fail closed',async()=>{const root='<?xml version="1.0"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Synthetic costs" sheetId="1" r:id="rId1" state="hidden"/></sheets></workbook>';await assert.rejects(previewXlsx(workbook({extra:{'xl/workbook.xml':root}}),options,context),/HIDDEN/);});
test('shared-string repetition cannot create an unbounded worker response',async()=>{const sheet='<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>'+Array.from({length:2100},(_,i)=>`<row r="${i+1}"><c r="A${i+1}" t="s"><v>0</v></c></row>`).join('')+'</sheetData></worksheet>';const extra={'xl/sharedStrings.xml':'<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><si><t>'+'x'.repeat(1000)+'</t></si></sst>','xl/_rels/workbook.xml.rels':'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/></Relationships>'};await assert.rejects(previewXlsx(workbook({changeSheet:()=>sheet,extra,zipOptions:{level:0}}),{...options,range:{startRow:1,endRow:2100,startColumn:1,endColumn:1}},context),/OUTPUT_LIMIT/);});
test('unselected visible worksheet content stays out of preview',async()=>{const extra={'xl/workbook.xml':'<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Synthetic costs" sheetId="1" r:id="rId1"/><sheet name="Unselected" sheetId="2" r:id="rId2"/></sheets></workbook>','xl/_rels/workbook.xml.rels':'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/></Relationships>','xl/worksheets/sheet2.xml':'<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>DO_NOT_RETURN</t></is></c></row></sheetData></worksheet>'};assert.doesNotMatch(JSON.stringify(await previewXlsx(workbook({extra}),options,context)),/DO_NOT_RETURN|Unselected/);});

test('numeric account identifiers fail rather than losing displayed leading zeroes',async()=>{await assert.rejects(previewXlsx(workbook({changeSheet:xml=>xml.replace(/<c r="A2"[^>]*>.*?<\/c>/,'<c r="A2"><v>123</v></c>')}),options,context),/NUMERIC_IDENTIFIER/);});
test('source range excludes arbitrary option metadata',async()=>{const p=await previewXlsx(workbook(),{...options,range:{...options.range,secret:'exclude'}},context);assert.deepEqual(p.source.range,options.range);});
test('formula string cells (t="str") read cached text from v, not inline string',async()=>{
 const account='Acct1100';
 const changeSheet=xml=>xml
  .replace(/<c r="A2"[^>]*>.*?<\/c>/,`<c r="A2" t="str"><v>${account}</v></c>`)
  .replace(/<c r="C2"[^>]*>.*?<\/c>/,`<c r="C2" t="inlineStr"><is><t>1000/${account}</t></is></c>`);
 const p=await previewXlsx(workbook({changeSheet}),options,context);
 assert.equal(p.rows[0].account,account);
 assert.equal(p.rows[0].sourceRow,2);
});
test('sheet names with XML entities resolve after decode',async()=>{
 const encodedName='Synthetic &amp; costs';
 const extra={'xl/workbook.xml':`<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${encodedName}" sheetId="1" r:id="rId1"/></sheets></workbook>`};
 const p=await previewXlsx(workbook({extra}),{...options,sheet:'Synthetic & costs'},context);
 assert.equal(p.source.sheet,'Synthetic & costs');
 assert.equal(p.totals.actuals,5000);
});
test('cells without r attributes derive sequential columns within a row',async()=>{
 const changeSheet=xml=>xml.replace('<row r="2">','<row r="2">').replaceAll(/<c r="[A-Z]\d+"([^>]*)>/g,(match,attrs)=>`<c${attrs}>`);
 const p=await previewXlsx(workbook({changeSheet}),options,context);
 assert.equal(p.rows[0].account,'1100');
 assert.equal(p.totals.actuals,5000);
});
for(const [name,cell,location] of [
 ['boolean amount','<c r="F2" t="b"><v>1</v></c>','amount'],
 ['error amount','<c r="F2" t="e"><v>7</v></c>','amount'],
 ['date amount','<c r="F2" t="d"><v>45292</v></c>','amount'],
 ['boolean text','<c r="A2" t="b"><v>1</v></c>','text'],
 ['error text','<c r="A2" t="e"><v>7</v></c>','text'],
]){
 test(`XLSX rejects ${name} in ${location} column`,async()=>{
  const changeSheet=xml=>xml.replace(location==='amount'?/<c r="F2"[^>]*>.*?<\/c>/:/<c r="A2"[^>]*>.*?<\/c>/,cell);
  await assert.rejects(previewXlsx(workbook({changeSheet}),options,context),/XLSX_CELL_TYPE_OR_LENGTH/);
 });
}

