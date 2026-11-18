/** Cost-only findings from a validated preview; never infers financing or payment timing. */
export function costFindings(preview) {
  const findings=[];
  for(const row of preview.rows){
    const base={account:row.account,sourceRow:row.sourceRow,...(row.lineId?{lineId:row.lineId}:{})};
    if(row.estimatedFinalCost>row.revisedBudget)findings.push({...base,code:'EFC_ABOVE_REVISED_BUDGET',amount:row.estimatedFinalCost-row.revisedBudget,question:'Review whether the separate finance plan covers the cost change.'});
    if(row.actuals>row.estimatedFinalCost)findings.push({...base,code:'ACTUALS_ABOVE_EFC',question:'Confirm actuals and EFC use the same reporting basis.'});
  }
  return {readOnly:true,findings,warnings:[...preview.warnings],unit:preview.unit,fundingGap:null,cashTimingGap:null,limitation:'Financing availability and cash timing require separate commitment evidence and dated cash flows.'};
}
