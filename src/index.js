import { createHash } from 'node:crypto';

export const fields = Object.freeze(['originalBudget','revisedBudget','actuals','openCommitments','estimateToComplete','estimatedFinalCost']);
const fail = message => { throw new Error(message); };
const date = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && new Date(value).toISOString().slice(0,10) === value;
function money(value) {
  if (typeof value !== 'string' || !/^-?\d{1,12}(\.\d{1,2})?$/.test(value)) fail('Expected explicit decimal amount with at most two places');
  const sign = value.startsWith('-') ? -1 : 1;
  const [whole, fraction=''] = value.replace('-', '').split('.');
  return sign * (Number(whole)*100 + Number(fraction.padEnd(2,'0')));
}

/** Strict synthetic mapped-row profile. Not a verified native vendor export schema. */
export function preview(input, context) {
  if (input.profile !== 'wrapbook-pas-synthetic-v1') fail('Unsupported report profile');
  const m = input.metadata;
  if (!m || m.tenantId !== context.tenantId || m.projectId !== context.projectId) fail('Project or tenant mismatch');
  for (const key of ['tenantId','projectId','revision','periodBasis','sourceName']) if (typeof m[key] !== 'string' || !m[key].trim()) fail('Missing provenance');
  if (!['USD','EUR','GBP','CAD','AUD'].includes(m.currency) || m.currency !== context.currency) fail('Unsupported or mismatched currency; no FX conversion is performed');
  if (!date(m.asOf) || !date(context.today) || m.asOf > context.today) fail('Invalid report date');
  if (m.commitmentBasis !== 'remaining-unpaid-only' || m.actualsBasis !== 'cumulative') fail('Ambiguous actual or commitment basis');
  if (!Array.isArray(input.rows) || !input.rows.length || input.rows.length > 10000) fail('Invalid row count');
  const allowed = new Set(['account','sourceRow','accountPath',...fields]);
  const seen = new Set();
  const totals = Object.fromEntries(fields.map(k=>[k,0]));
  const rows = input.rows.map((row,index)=>{
    if (Object.keys(row).some(k=>!allowed.has(k))) fail('Unexpected columns: remove unrelated or sensitive fields before import');
    if (typeof row.account !== 'string' || !/^[A-Za-z0-9._-]{1,40}$/.test(row.account) || seen.has(row.account)) fail('Invalid or duplicate account');
    seen.add(row.account);
    if(row.sourceRow!==undefined && (!Number.isSafeInteger(row.sourceRow)||row.sourceRow<1))fail('Invalid source row');
    const result = {account:row.account,sourceRow:row.sourceRow??index+2};
    if(row.accountPath!==undefined){
      if(!Array.isArray(row.accountPath)||!row.accountPath.length||row.accountPath.length>10||row.accountPath.at(-1)!==row.account||row.accountPath.some(a=>typeof a!=='string'||!/^[A-Za-z0-9._-]{1,40}$/.test(a)))fail('Invalid account hierarchy');
      result.accountPath=[...row.accountPath];
    }
    for (const key of fields) { result[key] = money(row[key]); totals[key] += result[key]; if (!Number.isSafeInteger(totals[key])) fail('Amount overflow'); }
    return result;
  });
  const leafPaths=rows.filter(r=>r.accountPath).map(r=>r.accountPath.join('/')).sort();
  for(let i=0;i<leafPaths.length-1;i++)if(leafPaths[i+1].startsWith(leafPaths[i]+'/'))fail('Account hierarchy contains both parent and detail amounts');
  for (const key of fields) if (money(input.controlTotals?.[key]) !== totals[key]) fail('Source totals do not reconcile');
  const metadata = Object.fromEntries(['tenantId','projectId','revision','periodBasis','sourceName','currency','asOf','commitmentBasis','actualsBasis'].map(k=>[k,m[k]]));
  const content = {profile:input.profile,metadata,rows,totals,unit:'minor-currency-units'};
  const id = createHash('sha256').update(JSON.stringify(content)).digest('hex');
  const warnings = ['Synthetic profile only; native Wrapbook export compatibility is unverified.','Cost data is not evidence of committed financing or collectible collateral.'];
  if ((Date.parse(context.today)-Date.parse(m.asOf))/86400000 > 30) warnings.push('Report is more than 30 days old.');
  return {...content,id,warnings,readOnly:true};
}

export function compare(previous,current) {
  for (const key of ['tenantId','projectId','currency','periodBasis','sourceName']) if (previous.metadata[key] !== current.metadata[key]) fail('Incompatible snapshots');
  if (current.metadata.asOf < previous.metadata.asOf) fail('Older report cannot replace newer snapshot');
  if (previous.id === current.id) return {duplicate:true,deltas:null};
  if (previous.metadata.revision === current.metadata.revision) fail('Revision identifier reused with changed content');
  return {duplicate:false,deltas:Object.fromEntries(fields.map(k=>[k,current.totals[k]-previous.totals[k]])),warning:'Cost changes do not establish a financing or cash-timing gap.'};
}
