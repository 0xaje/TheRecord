import { DEPLOYMENTS } from '../web/deployments.js';
export function proofDeployment(id = 'legacy') {
  const item = DEPLOYMENTS.find(d => d.id === id);
  if (!item) throw new Error('Unknown scoped-window deployment. Use legacy or withdrawal-v2.');
  return item;
}
export function deploymentArgument(args) {
  const index = args.indexOf('--deployment');
  if (args.filter(a => a === '--deployment').length > 1 || (index >= 0 && !args[index + 1])) throw new Error('Supply one deployment.');
  return proofDeployment(index < 0 ? 'legacy' : args[index + 1]);
}
export function proofNames(id = 'legacy') {
  proofDeployment(id);
  const suffix = id === 'legacy' ? '' : '-' + id;
  return { proof: 'scoped-proof' + suffix + '.json', journal: 'scoped-proof-started' + suffix + '.json', reviewed: 'scoped-proof-reviewed' + suffix + '.json' };
}
