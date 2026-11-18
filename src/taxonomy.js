/** TakeAgent topsheet band ids for future cross-walk; hints are provisional, never finance conclusions. */
export const topsheetBands = Object.freeze([
  'above-the-line',
  'below-the-line',
  'fringes',
  'contingency',
  'completion-bond',
  'insurance',
  'errors-omissions',
  'completion-delivery',
  'financing-cost',
  'reserve',
  'unclassified',
]);

/** Stable host-facing line id from a Wrapbook account code. */
export function lineIdForAccount(account) {
  return `wrapbook-account:${account}`;
}

/**
 * Provisional band hint from leading account digits (synthetic convention for tests).
 * Not a Wrapbook-certified COA map; attested exports may require user mapping.
 */
export function provisionalTaxonomyBandHint(account) {
  if (typeof account !== 'string' || !/^\d{2}/.test(account)) return {band: 'unclassified', source: 'provisional-prefix'};
  const head = account.slice(0, 2);
  const map = {
    '10': 'above-the-line',
    '11': 'above-the-line',
    '12': 'above-the-line',
    '13': 'above-the-line',
    '14': 'above-the-line',
    '15': 'above-the-line',
    '16': 'above-the-line',
    '17': 'above-the-line',
    '18': 'above-the-line',
    '19': 'above-the-line',
    '20': 'below-the-line',
    '21': 'below-the-line',
    '22': 'below-the-line',
    '23': 'below-the-line',
    '24': 'below-the-line',
    '25': 'below-the-line',
    '26': 'below-the-line',
    '27': 'below-the-line',
    '28': 'below-the-line',
    '29': 'below-the-line',
    '30': 'fringes',
    '31': 'fringes',
    '39': 'fringes',
    '40': 'contingency',
    '41': 'contingency',
    '50': 'completion-bond',
    '51': 'insurance',
    '52': 'errors-omissions',
    '53': 'completion-delivery',
    '60': 'financing-cost',
    '70': 'reserve',
  };
  return {band: map[head] ?? 'unclassified', source: 'provisional-prefix'};
}