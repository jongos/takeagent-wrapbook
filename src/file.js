import {previewCsv} from './csv.js';
import {previewXlsx} from './xlsx.js';
import {costFindings} from './companion.js';
import {presentPreview} from './presentation.js';
export const previewFileFindingLimit=100;
export async function previewFile(bytes,options,context){
 const snapshot=options?.format==='csv'?previewCsv(bytes,options,context):options?.format==='xlsx'?await previewXlsx(bytes,options,context):(()=>{throw new Error('Unsupported file format: select csv or xlsx');})();
 const fullReview=costFindings(snapshot);
 const totalFindingCount=fullReview.findings.length;
 const findings=fullReview.findings.slice(0,previewFileFindingLimit);
 return {snapshot,review:{...fullReview,findings,totalFindingCount,findingsTruncated:totalFindingCount>findings.length},readOnly:true};
}
export async function previewFileForHost(bytes,options,context,presentationOptions){
 return presentPreview(await previewFile(bytes,options,context),presentationOptions);
}
