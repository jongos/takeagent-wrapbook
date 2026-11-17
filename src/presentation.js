/** Present a fully validated preview. Never use truncated rows as an import snapshot. */
export function presentPreview(result,{limit=30}={}) {
 if(!Number.isInteger(limit)||limit<1||limit>100)throw new Error('Invalid presentation limit');
 const {snapshot,review}=result;
 const totalRowCount=snapshot.rows.length,totalFindingCount=review.totalFindingCount??review.findings.length;
 const source=snapshot.source?.cells?{...snapshot.source,cells:snapshot.source.cells.slice(0,limit)}:snapshot.source;
 const output={snapshot:{...snapshot,rows:snapshot.rows.slice(0,limit),...(source?{source}:{})},review:{...review,findings:review.findings.slice(0,limit)},totalRowCount,totalFindingCount,truncated:totalRowCount>limit||totalFindingCount>limit,readOnly:true,presentationOnly:true};
 if(Buffer.byteLength(JSON.stringify(output),'utf8')>256_000)throw new Error('Presentation byte limit');
 return output;
}
