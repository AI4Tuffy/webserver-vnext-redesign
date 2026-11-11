// Keep development and production on the same browser origin as the API.
export const backendPathPattern = '^/(?:api|hub|assets|openapi|swagger|api-docs|healthz|metrics|error|agent)(?:/|$)|^/favicon\\.webp$'
const backendPaths = new RegExp(backendPathPattern, 'i')

export function isBackendPath(pathname) {
  return backendPaths.test(pathname)
}

export function backendOrigin(value = 'http://127.0.0.1:8080') {
  const url = new URL(value)
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
      url.pathname !== '/' || url.search || url.hash) {
    throw new Error('BACKEND_URL must be an HTTP(S) origin without credentials, path, query or fragment.')
  }
  return url.origin
}
