import {previewCsv} from './csv.js';
import {previewXlsx} from './xlsx.js';
import {costFindings} from './companion.js';
import {presentPreview} from './presentation.js';
export async function previewFile(bytes,options,context){
 const snapshot=options?.format==='csv'?previewCsv(bytes,options,context):options?.format==='xlsx'?await previewXlsx(bytes,options,context):(()=>{throw new Error('Unsupported file format: select csv or xlsx');})();
 return {snapshot,review:costFindings(snapshot),readOnly:true};
}
export async function previewFileForHost(bytes,options,context,presentationOptions){
 return presentPreview(await previewFile(bytes,options,context),presentationOptions);
}
