import { createHash } from 'node:crypto';
import { fields, preview } from './index.js';

export const limits = Object.freeze({bytes: 2_000_000, rows: 10002, columns: 32, cellCharacters: 1000});
function reject(message) { throw new Error(message); }

/** UTF-8 comma-delimited CSV only; strict quotes, no inference, no truncation. */
export function parseCsv(bytes) {
  if (!(bytes instanceof Uint8Array) || !bytes.length || bytes.length > limits.bytes) reject('CSV byte limit');
  let text;
  try { text = new TextDecoder('utf-8', {fatal:true}).decode(bytes); } catch { reject('CSV must be UTF-8'); }
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  if (text.includes('\0')) reject('NUL is not supported');
  const records=[]; let cells=[], cell='', state='start', line=1, sourceRow=1;
  function field() { if (cell.length > limits.cellCharacters) reject('CSV cell limit'); cells.push(cell); cell=''; state='start'; if (cells.length>limits.columns) reject('CSV column limit'); }
  function record() { field(); records.push({cells,sourceRow}); cells=[]; if(records.length>limits.rows) reject('CSV row limit'); }
  for(let i=0;i<text.length;i++) {
    const c=text[i];
    if(state==='quoted') {
      if(c==='"') { if(text[i+1]==='"'){cell+='"';i++;} else state='closed'; }
      else {cell+=c;if(c==='\n')line++;}
    } else if(c===',') field();
    else if(c==='\r'||c==='\n') { if(c==='\r' && text[i+1]!=='\n') reject('Bare CR is not supported');record();if(c==='\r')i++;line++;sourceRow=line; }
    else if(state==='closed') reject('Unexpected character after CSV quote');
    else if(c==='"') {if(state!=='start')reject('Unexpected CSV quote');state='quoted';}
    else {cell+=c;state='plain';}
    if(cell.length>limits.cellCharacters)reject('CSV cell limit');
  }
  if(state==='quoted')reject('Unterminated CSV quote');
  if(cells.length||cell||state!=='start')record();
  if(records.length<3)reject('CSV requires header, detail and total rows');
  const headers=records[0].cells;
  if(headers.some(h=>!h||h.length>80)||new Set(headers).size!==headers.length)reject('Missing or duplicate CSV header');
  if(records.some(r=>r.cells.length!==headers.length))reject('Ragged CSV rows');
  return {headers,records:records.slice(1)};
}

/** Explicit per-file mapping reviewed by host; never assumes native Wrapbook headers. */
export function previewCsv(bytes, options, context) {
  if(options?.profile!=='wrapbook-pas-mapped-csv-v1' || options.reviewedMapping!==true)reject('Reviewed CSV mapping required');
  if(options.completeForSelectedScope!==true)reject('Confirm report completeness for the selected scope');
  const {headers,records}=parseCsv(bytes);
  const required=['account','rowType',...fields], mapping=options.mapping;
  if(!mapping || Object.keys(mapping).some(k=>![...required,'accountPath'].includes(k)))reject('Unsupported mapping key');
  const keys=[...required,...(mapping.accountPath?['accountPath']:[])];
  if(keys.some(k=>typeof mapping[k]!=='string'||!headers.includes(mapping[k])))reject('Missing mapped column');
  if(new Set(keys.map(k=>mapping[k])).size!==keys.length)reject('Ambiguous mapping');
  // No unrelated payroll/bank/description columns accepted, even if unmapped.
  if(headers.length!==keys.length)reject('Remove unrelated columns before import');
  const columns=Object.fromEntries(keys.map(k=>[k,headers.indexOf(mapping[k])]));
  const rows=[];let controlTotals;let totalRow;
  for(const record of records){
    const value=k=>record.cells[columns[k]];
    const amounts=Object.fromEntries(fields.map(k=>[k,value(k)]));
    if(value('rowType')==='total'){
      if(controlTotals||record!==records.at(-1)||value('account')!==''||(mapping.accountPath&&value('accountPath')!==''))reject('One final total row with blank account is required');
      controlTotals=amounts;totalRow=record.sourceRow;
    }else if(value('rowType')==='detail'){
      const row={account:value('account'),...amounts,sourceRow:record.sourceRow};
      if(mapping.accountPath)row.accountPath=value('accountPath').split('/');
      rows.push(row);
    }else reject('Only explicit detail/total rows supported; subtotal and episodic layouts need separate profiles');
  }
  if(!controlTotals)reject('Missing source control total');
  const result=preview({profile:'wrapbook-pas-synthetic-v1',metadata:options.metadata,rows,controlTotals},context);
  const source={format:'csv',profile:options.profile,sha256:createHash('sha256').update(bytes).digest('hex'),columns:Object.fromEntries(keys.map(k=>[k,columns[k]+1])),totalRow};
  return {...result,source,warnings:[...result.warnings,'Mapped CSV is not a vendor-certified native export profile.']};
}
