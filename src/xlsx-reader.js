import {fromBuffer} from 'yauzl';
import sax from 'sax';

export const xlsxLimits=Object.freeze({compressed:2_000_000,expanded:15_000_000,entry:8_000_000,entries:150,sheets:5,rows:10002,columns:32,cellCharacters:1000});
function reject(code){const error=new Error(code);error.code=code;throw error;}
const disallowedCellTypes=new Set(['b','d','e']);
function decodeXmlEntities(value){
 return value.replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&quot;','"').replaceAll('&apos;',"'").replaceAll('&amp;','&');
}
function address(value){const match=/^([A-Z]{1,3})([1-9]\d{0,4})$/.exec(value||'');if(!match)reject('XLSX_ADDRESS');let column=0;for(const c of match[1])column=column*26+c.charCodeAt(0)-64;if(column>xlsxLimits.columns||Number(match[2])>xlsxLimits.rows)reject('XLSX_DIMENSIONS');return {row:Number(match[2]),column};}
function inspectXml(xml){
 const p=sax.parser(true,{xmlns:true});let depth=0,sheets=0,currentRow=0,lastRow=0,cells=0,nextCol=0;const addresses=new Set();
 p.ondoctype=()=>reject('XLSX_DOCTYPE');p.onerror=()=>reject('XLSX_XML');
 p.onopentag=tag=>{
  if(++depth>40)reject('XLSX_XML_DEPTH');const name=tag.local;const attr=key=>tag.attributes[key]?.value;
  if(['f','definedName','mergeCell','oleObject','control','externalReference','dataValidation','hyperlink'].includes(name))reject('XLSX_ACTIVE_OR_MERGED_CONTENT');
  if((name==='row'||name==='col')&&['1','true'].includes(attr('hidden')))reject('XLSX_HIDDEN_CONTENT');
  if(name==='sheet'){if(++sheets>xlsxLimits.sheets)reject('XLSX_SHEET_LIMIT');if(attr('state')&&attr('state')!=='visible')reject('XLSX_HIDDEN_CONTENT');}
  if(name==='Relationship'&&(attr('TargetMode')?.toLowerCase()==='external'||/(?:^|\/)\.\.(?:\/|$)|^[a-z]+:|\\/i.test(attr('Target')||'')))reject('XLSX_EXTERNAL_RELATIONSHIP');
  if(name==='Override'&&/macroEnabled|vbaProject|activeX/i.test(attr('ContentType')||''))reject('XLSX_ACTIVE_CONTENT');
  if(name==='dimension')for(const ref of (attr('ref')||'').split(':'))address(ref);
  if(name==='row'){currentRow=Number(attr('r'));if(!Number.isInteger(currentRow)||currentRow<=lastRow||currentRow>xlsxLimits.rows)reject('XLSX_ROW_ORDER');lastRow=currentRow;nextCol=1;}
  if(name==='c'){
   if(++cells>xlsxLimits.rows*xlsxLimits.columns)reject('XLSX_CELL_LIMIT');
   if(disallowedCellTypes.has(attr('t')||''))reject('XLSX_CELL_TYPE_OR_LENGTH');
   const ref=attr('r');const column=ref?address(ref).column:nextCol++;
   if(ref){const a=address(ref);if(a.row!==currentRow||addresses.has(ref))reject('XLSX_CELL_ORDER');addresses.add(ref);}else{if(!currentRow)reject('XLSX_CELL_ORDER');addresses.add(`${currentRow}:${column}`);}
  }
 };
 p.onclosetag=()=>depth--;p.write(xml).close();
}
function parseSharedStrings(xml){
 if(!xml)return[];
 const strings=[];let inSi=false,inT=false,buffer='';
 const stack=[];
 const p=sax.parser(true,{xmlns:true});
 p.onopentag=tag=>{stack.push(tag.local);if(tag.local==='si')inSi=true;if(tag.local==='t'&&inSi)inT=true;};
 p.onclosetag=()=>{
  const name=stack.pop();
  if(name==='t'&&inT)inT=false;
  if(name==='si'){strings.push(buffer);buffer='';inSi=false;}
 };
 p.ontext=text=>{if(inT)buffer+=text;};
 p.onerror=()=>reject('XLSX_XML');
 p.write(xml).close();
 return strings;
}
function resolveWorksheetPart(parts,sheetName){
 const workbook=parts.get('xl/workbook.xml');
 if(!workbook)reject('XLSX_REQUIRED_PARTS');
 let sheetMatch;
 for(const tag of workbook.matchAll(/<sheet\b([^>]*)\/?>/gi)){
  const attrs=tag[1];
  const nameMatch=/\bname="([^"]*)"/i.exec(attrs);
  const idMatch=/\br:id="([^"]+)"/i.exec(attrs);
  if(!nameMatch||!idMatch)continue;
  if(decodeXmlEntities(nameMatch[1])===sheetName){sheetMatch=[null,idMatch[1]];break;}
 }
 if(!sheetMatch)reject('XLSX_SHEET_SELECTION');
 const rels=parts.get('xl/_rels/workbook.xml.rels');
 if(!rels)reject('XLSX_REQUIRED_PARTS');
 const relMatch=new RegExp(`<Relationship\\b[^>]*\\bId="${sheetMatch[1]}"[^>]*\\bTarget="([^"]+)"`,'i').exec(rels);
 if(!relMatch)reject('XLSX_SHEET_SELECTION');
 const target=relMatch[1].replace(/^\//,'');
 const normalized=target.startsWith('xl/')?target.toLowerCase():`xl/${target}`.toLowerCase();
 if(!parts.has(normalized))reject('XLSX_SHEET_SELECTION');
 return normalized;
}
function extractWorksheetCells(xml,sharedStrings){
 const cells=new Map();
 let currentRow=0,currentCol=0,nextCol=0,cellType='',text='',inlineText=false,captureV=false,captureT=false;
 const stack=[];
 const p=sax.parser(true,{xmlns:true});
 p.ondoctype=()=>reject('XLSX_DOCTYPE');p.onerror=()=>reject('XLSX_XML');
 const commit=(fromNumeric)=>{cells.set(`${currentRow}:${currentCol}`,{value:text,fromNumeric});text='';};
 p.onopentag=tag=>{
  stack.push(tag.local);
  const name=tag.local;const attr=key=>tag.attributes[key]?.value;
  if(name==='row'){currentRow=Number(attr('r'));nextCol=1;}
  if(name==='c'){
   cellType=attr('t')||'';
   if(disallowedCellTypes.has(cellType))reject('XLSX_CELL_TYPE_OR_LENGTH');
   const ref=attr('r');
   if(ref){const a=address(ref);currentRow=a.row;currentCol=a.column;nextCol=a.column+1;}
   else{if(!currentRow)reject('XLSX_CELL_ORDER');currentCol=nextCol++;}
   text='';inlineText=false;captureV=false;captureT=false;
  }
  if(name==='v')captureV=true;
  if(name==='t')captureT=inlineText||cellType==='inlineStr';
  if(name==='is')inlineText=true;
 };
 p.ontext=value=>{if(captureT||captureV)text+=value;};
 p.onclosetag=()=>{
  const name=stack.pop();
  if(name==='v'){
   captureV=false;
   if(cellType==='s'){
    const index=Number(text);
    if(!Number.isInteger(index)||index<0||index>=sharedStrings.length)reject('XLSX_CELL_TYPE_OR_LENGTH');
    text=sharedStrings[index];
    commit(false);
   }else if(cellType==='inlineStr'){
    /* committed on </is> */
   }else if(cellType==='str'){
    commit(false);
   }else{
    commit(true);
   }
  }
  if(name==='is'&&cellType==='inlineStr'){captureT=false;commit(false);}
  if(name==='t'&&cellType==='inlineStr')captureT=false;
 };
 p.write(xml).close();
 return cells;
}
async function validateArchive(buffer,parts=null){
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
    stream.on('end',()=>{if(done)return;try{if(size!==entry.uncompressedSize)reject('XLSX_ENTRY_SIZE');if(/\.(xml|rels)$/i.test(entry.fileName)){const decoded=new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(chunks));inspectXml(decoded);if(parts)parts.set(lower,decoded);}zip.readEntry();}catch(e){fail(e);}});
   });
  }catch(e){fail(e);}});
  zip.on('end',()=>{if(done)return;if(!names.has('[content_types].xml')||!names.has('xl/workbook.xml')){fail(Object.assign(new Error('XLSX_REQUIRED_PARTS'),{code:'XLSX_REQUIRED_PARTS'}));return;}done=true;zip.close();resolve();});zip.readEntry();
 }));
}
export async function readSelectedWorkbook(bytes,{sheet,range,identifierHeaders=[]}){
 const buffer=Buffer.from(bytes);
 if(typeof sheet!=='string'||!sheet||sheet.length>160||!range)reject('XLSX_SELECTION_REQUIRED');
 for(const key of ['startRow','endRow','startColumn','endColumn'])if(!Number.isInteger(range[key])||range[key]<1)reject('XLSX_RANGE');
 if(range.endRow<range.startRow+2||range.endRow>xlsxLimits.rows||range.endColumn<range.startColumn||range.endColumn>xlsxLimits.columns)reject('XLSX_RANGE');
 const parts=new Map();
 await validateArchive(buffer,parts);
 const sharedStrings=parseSharedStrings(parts.get('xl/sharedstrings.xml'));
 const worksheet=resolveWorksheetPart(parts,sheet);
 const cells=extractWorksheetCells(parts.get(worksheet),sharedStrings);
 const headerByColumn=new Map();
 for(let c=range.startColumn;c<=range.endColumn;c++)headerByColumn.set(c,cells.get(`${range.startRow}:${c}`)?.value??'');
 const rows=[];let tableBytes=2;
 for(let r=range.startRow;r<=range.endRow;r++){
  const row=[];for(let c=range.startColumn;c<=range.endColumn;c++){
   const cell=cells.get(`${r}:${c}`);
   let value=cell?.value??'';
   if(cell?.fromNumeric&&(r===range.startRow||identifierHeaders.includes(headerByColumn.get(c))))reject('XLSX_NUMERIC_IDENTIFIER');
   if(typeof value!=='string'||value.length>xlsxLimits.cellCharacters||/[\r\n\0]/.test(value))reject('XLSX_CELL_TYPE_OR_LENGTH');
   row.push(value);
  }
  tableBytes+=Buffer.byteLength(JSON.stringify(row),'utf8')+1;if(tableBytes>2_000_000)reject('XLSX_OUTPUT_LIMIT');rows.push(row);
 }
 return rows;
}