#!/usr/bin/env node
import {open} from 'node:fs/promises';
import {previewFile} from '../src/file.js';
async function readBounded(path,limit){const file=await open(path,'r');try{const stat=await file.stat();if(!stat.isFile()||stat.size>limit)throw new Error('INPUT_LIMIT');const bytes=Buffer.alloc(limit+1);let size=0;while(size<bytes.length){const read=await file.read(bytes,size,bytes.length-size,null);if(!read.bytesRead)break;size+=read.bytesRead;}if(size>limit)throw new Error('INPUT_LIMIT');return bytes.subarray(0,size);}finally{await file.close();}}
const [file,optionsPath,contextPath,...extra]=process.argv.slice(2);
if(!file||!optionsPath||!contextPath||extra.length){process.stderr.write('Usage: node bin/preview.mjs <csv-or-xlsx> <reviewed-options.json> <trusted-context.json>\n');process.exitCode=1;}
else try{const bytes=await readBounded(file,2_000_000);const options=JSON.parse((await readBounded(optionsPath,65536)).toString('utf8'));const context=JSON.parse((await readBounded(contextPath,4096)).toString('utf8'));process.stdout.write(JSON.stringify(await previewFile(bytes,options,context),null,2)+'\n');}catch{process.stderr.write('Preview failed: check file bounds, selected table, reviewed mapping, scope and source totals. No data was written.\n');process.exitCode=1;}
