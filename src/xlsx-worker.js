import {parentPort,workerData} from 'node:worker_threads';
import {readSelectedWorkbook} from './xlsx-reader.js';
try{const tableJson=JSON.stringify(await readSelectedWorkbook(workerData.bytes,workerData.selection));if(Buffer.byteLength(tableJson,'utf8')>2_000_000)throw Object.assign(new Error('XLSX_OUTPUT_LIMIT'),{code:'XLSX_OUTPUT_LIMIT'});parentPort.postMessage({tableJson});}catch(error){parentPort.postMessage({error:typeof error.code==='string'&&/^XLSX_[A-Z_]+$/.test(error.code)?error.code:'XLSX_PARSE_FAILED'});}
