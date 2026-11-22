import { NATIVE_PROFILE } from './native-cost-detail-csv.js';

/** Cost-only findings from a validated preview; never infers financing or payment timing. */
export function costFindings(preview) {
  const findings=[];
  if (preview.profile === NATIVE_PROFILE || preview.profileCertification === 'provisional') {
    findings.push({
      code: 'PROVISIONAL_VENDOR_PROFILE',
      profile: preview.profile,
      question:
        'This native export profile is provisional; confirm vendor-default Detail CSV layout and report settings before certified use.',
    });
  }
  for(const row of preview.rows){
    const base={account:row.account,sourceRow:row.sourceRow,...(row.lineId?{lineId:row.lineId}:{})};
    if(row.estimatedFinalCost>row.revisedBudget)findings.push({...base,code:'EFC_ABOVE_REVISED_BUDGET',amount:row.estimatedFinalCost-row.revisedBudget,question:'Review whether the separate finance plan covers the cost change.'});
    if(row.actuals>row.estimatedFinalCost)findings.push({...base,code:'ACTUALS_ABOVE_EFC',question:'Confirm actuals and EFC use the same reporting basis.'});
  }
  const noDeficit=null;
  return {readOnly:true,findings,warnings:[...preview.warnings],unit:preview.unit,fundingGap:noDeficit,cashTimingGap:noDeficit,fundingDeficit:noDeficit,cashTimingDeficit:noDeficit,limitation:'Financing availability and cash timing require separate commitment evidence and dated cash flows.'};
}
