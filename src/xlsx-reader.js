import {fromBuffer} from 'yauzl';
import sax from 'sax';
import readExcelFile from 'read-excel-file/node';

export const xlsxLimits=Object.freeze({compressed:2_000_000,expanded:15_000_000,entry:8_000_000,entries:150,sheets:5,rows:10002,columns:32,cellCharacters:1000});
function reject(code){const error=new Error(code);error.code=code;throw error;}
function address(value){const match=/^([A-Z]{1,3})([1-9]\d{0,4})$/.exec(value||'');if(!match)reject('XLSX_ADDRESS');let column=0;for(const c of match[1])column=column*26+c.charCodeAt(0)-64;if(column>xlsxLimits.columns||Number(match[2])>xlsxLimits.rows)reject('XLSX_DIMENSIONS');return {row:Number(match[2]),column};}
function inspectXml(xml){
 const p=sax.parser(true,{xmlns:true});let depth=0,sheets=0,currentRow=0,lastRow=0,cells=0;const addresses=new Set();
 p.ondoctype=()=>reject('XLSX_DOCTYPE');p.onerror=()=>reject('XLSX_XML');
 p.onopentag=tag=>{
  if(++depth>40)reject('XLSX_XML_DEPTH');const name=tag.local;const attr=key=>tag.attributes[key]?.value;
  if(['f','definedName','mergeCell','oleObject','control','externalReference','dataValidation','hyperlink'].includes(name))reject('XLSX_ACTIVE_OR_MERGED_CONTENT');
  if((name==='row'||name==='col')&&['1','true'].includes(attr('hidden')))reject('XLSX_HIDDEN_CONTENT');
  if(name==='sheet'){if(++sheets>xlsxLimits.sheets)reject('XLSX_SHEET_LIMIT');if(attr('state')&&attr('state')!=='visible')reject('XLSX_HIDDEN_CONTENT');}
  if(name==='Relationship'&&(attr('TargetMode')?.toLowerCase()==='external'||/(?:^|\/)\.\.(?:\/|$)|^[a-z]+:|\\/i.test(attr('Target')||'')))reject('XLSX_EXTERNAL_RELATIONSHIP');
  if(name==='Override'&&/macroEnabled|vbaProject|activeX/i.test(attr('ContentType')||''))reject('XLSX_ACTIVE_CONTENT');
  if(name==='dimension')for(const ref of (attr('ref')||'').split(':'))address(ref);
  if(name==='row'){currentRow=Number(attr('r'));if(!Number.isInteger(currentRow)||currentRow<=lastRow||currentRow>xlsxLimits.rows)reject('XLSX_ROW_ORDER');lastRow=currentRow;}
  if(name==='c'){if(++cells>xlsxLimits.rows*xlsxLimits.columns)reject('XLSX_CELL_LIMIT');const a=address(attr('r'));if(a.row!==currentRow||addresses.has(attr('r')))reject('XLSX_CELL_ORDER');addresses.add(attr('r'));}
 };
 p.onclosetag=()=>depth--;p.write(xml).close();
}
async function validateArchive(buffer){
 if(buffer.length<4||buffer.length>xlsxLimits.compressed||buffer.readUInt32LE(0)!==0x04034b50)reject('XLSX_ARCHIVE_SIZE_OR_FORMAT');
 await new Promise((resolve,rejectPromise)=>fromBuffer(buffer,{lazyEntries:true,strictFileNames:true,validateEntrySizes:true},(error,zip)=>{
  if(error||!zip){rejectPromise(Object.assign(new Error('XLSX_ARCHIVE'),{code:'XLSX_ARCHIVE'}));return;}
  let total=0,count=0,done=false;const names=new Set();let active;
  const fail=error=>{if(done)return;done=true;active?.destroy();zip.close();rejectPromise(error);};
  zip.on('error',()=>fail(Object.assign(new Error('XLSX_ARCHIVE'),{code:'XLSX_ARCHIVE'})));
  zip.on('entry',entry=>{try{
   const lower=entry.fileName.toLowerCase();if(++count>xlsxLimits.entries||names.has(lower))reject('XLSX_ENTRY_LIMIT_OR_DUPLICATE');names.add(lower);
   if(entry.generalPurposeBitFlag&1)reject('XLSX_ENCRYPTED');total+=entry.uncompressedSize;
   if(entry.uncompressedSize>xlsxLimits.entry||total>xlsxLimits.expanded||entry.uncompressedSize>Math.max(100000,entry.compressedSize*100))reject('XLSX_EXPANSION_LIMIT');
   if(/vba|externalLinks\/|embeddings\/|activeX\/|connections\.xml|customXml\/|\.bin$/i.test(entry.fileName))reject('XLSX_ACTIVE_CONTENT');
   if(entry.fileName.endsWith('/')){zip.readEntry();return;}
   zip.openReadStream(entry,(err,stream)=>{
    if(err||!stream){fail(Object.assign(new Error('XLSX_ENTRY'),{code:'XLSX_ENTRY'}));return;}active=stream;let size=0;const chunks=[];
    stream.on('data',chunk=>{size+=chunk.length;if(size>entry.uncompressedSize||size>xlsxLimits.entry){fail(Object.assign(new Error('XLSX_EXPANSION_LIMIT'),{code:'XLSX_EXPANSION_LIMIT'}));return;}chunks.push(chunk);});
    stream.on('error',()=>fail(Object.assign(new Error('XLSX_ENTRY'),{code:'XLSX_ENTRY'})));
    stream.on('end',()=>{if(done)return;try{if(size!==entry.uncompressedSize)reject('XLSX_ENTRY_SIZE');if(/\.(xml|rels)$/i.test(entry.fileName))inspectXml(new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(chunks)));zip.readEntry();}catch(e){fail(e);}});
   });
  }catch(e){fail(e);}});
  zip.on('end',()=>{if(done)return;if(!names.has('[content_types].xml')||!names.has('xl/workbook.xml')){fail(Object.assign(new Error('XLSX_REQUIRED_PARTS'),{code:'XLSX_REQUIRED_PARTS'}));return;}done=true;zip.close();resolve();});zip.readEntry();
 }));
}
export async function readSelectedWorkbook(bytes,{sheet,range,identifierHeaders=[]}){
 const buffer=Buffer.from(bytes);await validateArchive(buffer);
 if(typeof sheet!=='string'||!sheet||sheet.length>160||!range)reject('XLSX_SELECTION_REQUIRED');
 for(const key of ['startRow','endRow','startColumn','endColumn'])if(!Number.isInteger(range[key])||range[key]<1)reject('XLSX_RANGE');
 if(range.endRow<range.startRow+2||range.endRow>xlsxLimits.rows||range.endColumn<range.startColumn||range.endColumn>xlsxLimits.columns)reject('XLSX_RANGE');
 const sheets=await readExcelFile(buffer,{sheets:[sheet],parseNumber:value=>({numeric:value}),trim:false});
 if(sheets.length!==1||sheets[0].sheet!==sheet)reject('XLSX_SHEET_SELECTION');
 const data=sheets[0].data;if(range.endRow>data.length)reject('XLSX_RANGE');
 const rows=[];let tableBytes=2;
 for(let r=range.startRow;r<=range.endRow;r++){
  const row=[];for(let c=range.startColumn;c<=range.endColumn;c++){
   let value=data[r-1]?.[c-1]??'';
   if(value&&typeof value==='object'&&typeof value.numeric==='string'){if(r===range.startRow||identifierHeaders.includes(data[range.startRow-1]?.[c-1]))reject('XLSX_NUMERIC_IDENTIFIER');value=value.numeric;}
   if(typeof value!=='string'||value.length>xlsxLimits.cellCharacters||/[\r\n\0]/.test(value))reject('XLSX_CELL_TYPE_OR_LENGTH');row.push(value);
  }tableBytes+=Buffer.byteLength(JSON.stringify(row),'utf8')+1;if(tableBytes>2_000_000)reject('XLSX_OUTPUT_LIMIT');rows.push(row);
 }
 return rows;
}
