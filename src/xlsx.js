import {Worker} from 'node:worker_threads';
import {createHash} from 'node:crypto';
import {previewCsv} from './csv.js';
import {xlsxLimits} from './xlsx-reader.js';
export {xlsxLimits};
const columnName=number=>{let result='';while(number){number--;result=String.fromCharCode(65+number%26)+result;number=Math.floor(number/26);}return result;};
export async function previewXlsx(bytes,options,context){
 if(!(bytes instanceof Uint8Array)||!bytes.length||bytes.length>xlsxLimits.compressed)throw new Error('XLSX_ARCHIVE_SIZE_OR_FORMAT');
 if(options?.profile!=='wrapbook-pas-mapped-xlsx-v1'||options.reviewedMapping!==true||options.completeForSelectedScope!==true)throw new Error('Reviewed complete XLSX mapping required');
 if(typeof options.sheet!=='string'||!options.sheet||options.sheet.length>160||!options.range)throw new Error('XLSX_SELECTION_REQUIRED');
 const range=Object.fromEntries(['startRow','endRow','startColumn','endColumn'].map(key=>[key,options.range[key]]));
 if(Object.values(range).some(value=>!Number.isInteger(value)||value<1)||range.endRow>xlsxLimits.rows||range.endColumn>xlsxLimits.columns||range.endRow<range.startRow+2||range.endColumn<range.startColumn)throw new Error('XLSX_RANGE');
 const rows=await new Promise((resolve,reject)=>{
  const worker=new Worker(new URL('./xlsx-worker.js',import.meta.url),{workerData:{bytes,selection:{sheet:options.sheet,range,identifierHeaders:[options.mapping?.account,options.mapping?.accountPath,options.mapping?.rowType].filter(v=>typeof v==='string'&&v.length<=1000)}},resourceLimits:{maxOldGenerationSizeMb:128,maxYoungGenerationSizeMb:32,stackSizeMb:4}});
  let done=false;const finish=async(error,value)=>{if(done)return;done=true;clearTimeout(timer);await worker.terminate().catch(()=>{});error?reject(error):resolve(value);};
  const timer=setTimeout(()=>finish(new Error('XLSX_TIMEOUT')),10000);
  worker.once('message',value=>{if(value?.error){void finish(new Error(value.error));return;}if(typeof value?.tableJson!=='string'||value.tableJson.length>2_000_000||Buffer.byteLength(value.tableJson,'utf8')>2_000_000){void finish(new Error('XLSX_OUTPUT_LIMIT'));return;}try{void finish(null,JSON.parse(value.tableJson));}catch{void finish(new Error('XLSX_PARSE_FAILED'));}});worker.once('error',()=>void finish(new Error('XLSX_WORKER_FAILED')));worker.once('exit',()=>{if(!done)void finish(new Error('XLSX_WORKER_FAILED'));});
 });
 const text=rows.map(row=>row.map(value=>'"'+value.replaceAll('"','""')+'"').join(',')).join('\n');
 const result=previewCsv(new TextEncoder().encode(text),{...options,profile:'wrapbook-pas-mapped-csv-v1'},context);
 const offset=options.range.startRow-1;
 const mappedRows=result.rows.map(row=>({...row,sourceRow:row.sourceRow+offset}));
 const columns=Object.fromEntries(Object.entries(result.source.columns).map(([key,value])=>[key,value+options.range.startColumn-1]));
 const source={format:'xlsx',profile:options.profile,sha256:createHash('sha256').update(bytes).digest('hex'),sheet:options.sheet,range:{...range},columns,totalRow:result.source.totalRow+offset,cells:mappedRows.map(row=>({account:row.account,references:Object.fromEntries(Object.entries(columns).map(([key,col])=>[key,`${columnName(col)}${row.sourceRow}`]))}))};
 const content={profile:result.profile,metadata:result.metadata,rows:mappedRows,totals:result.totals,unit:result.unit};
 return {...result,...content,id:createHash('sha256').update(JSON.stringify(content)).digest('hex'),source,warnings:result.warnings.filter(w=>!w.startsWith('Mapped CSV')).concat('Values-only mapped XLSX profile; native Wrapbook workbook compatibility is unverified.')};
}
