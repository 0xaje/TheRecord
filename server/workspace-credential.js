// Authorization is redacted by the hosting request logger. Never log either credential.
export function workspaceCredential(request) {
  const authorization = request.headers.get('Authorization');
  const legacy = request.headers.get('X-Record-Workspace');
  if (authorization === null) return legacy; // Compatibility for already-open older clients.
  const key = authorization.match(/^Bearer workspace:([a-f0-9]{64})$/)?.[1];
  if (!key || (legacy !== null && legacy !== key)) return ''; // Fail closed on malformed/conflicting identity.
  return key;
}
