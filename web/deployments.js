// Only verified deployments belong here. Never insert a placeholder address.
export const LEGACY_DEPLOYMENT = Object.freeze({
  id: 'legacy', label: 'Original Diana contract',
  address: '0x25721b3be0f24438da7daed4c800b073ef9bb802',
  fromBlock: 10092612n, withdrawals: false,
});
export const DEPLOYMENTS = Object.freeze([LEGACY_DEPLOYMENT]);
export function resolveDeployment(search, deployments = DEPLOYMENTS) {
  const id = new URLSearchParams(search).get('deployment');
  const deployment = deployments.find(item => item.id === (id ?? 'legacy'));
  if (!deployment) throw new Error('Unknown agreement contract. Use a link for a verified deployment.');
  return deployment;
}
export function agreementQuery(deployment, id, version) {
  return new URLSearchParams({ ...(deployment.id === 'legacy' ? {} : { deployment: deployment.id }), id, version: String(version) });
}
export function versionPresentation({ matches, approvals, finalized, withdrawn = false }) {
  if (withdrawn && finalized) throw new Error('Inconsistent agreement state.');
  const count = approvals === 3 ? 2 : approvals === 0 ? 0 : 1;
  return {
    count, canApprove: matches && !finalized && !withdrawn,
    status: withdrawn ? 'Withdrawn · earlier approvals do not count toward a correction' : finalized ? 'Finalized · 2 of 2 approvals recorded' : `Awaiting approval · ${count} of 2 approvals recorded`,
    message: !matches ? (withdrawn ? 'File does not match this withdrawn version.' : 'File does not match this version.') : withdrawn ? 'File matches a withdrawn version. This version cannot be approved.' : finalized ? 'File matches the finalized version.' : 'File matches. This version is awaiting approval.',
  };
}
