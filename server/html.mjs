import { randomBytes } from 'node:crypto'

export const defaultMetadata = {
  title: 'YINYU',
  description: 'YINYU 安全综合演练平台提供赛事管理、攻防演练、理论训练与分布式靶场调度能力。',
}

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character])

export function renderIndex(template, metadata = defaultMetadata) {
  const nonce = randomBytes(24).toString('base64')
  const values = {
    title: escapeHtml(metadata.title),
    description: escapeHtml(metadata.description),
    lang: 'zh-CN',
    nonce,
  }
  return {
    html: template.replace(/%(title|description|lang|nonce)%/g, (_, key) => values[key]),
    // Match the existing backend policy; dynamic scripts inherit the request nonce.
    csp: `default-src 'strict-dynamic' 'nonce-${nonce}' 'unsafe-inline' http: https:; ` +
      "style-src 'self' 'unsafe-inline'; img-src * 'self' data: blob:; " +
      "font-src * 'self' data:; object-src 'none'; frame-src * https:; " +
      "connect-src 'self' http://127.0.0.1:*; base-uri 'none';",
  }
}

export function createMetadataReader(origin, fallback = defaultMetadata) {
  let metadata = fallback
  let expiresAt = 0
  let pending
  return async () => {
    if (Date.now() < expiresAt) return metadata
    if (!pending) {
      pending = (async () => {
        try {
          const response = await fetch(`${origin}/api/config`, {
            headers: { Accept: 'application/json' },
            signal: AbortSignal.timeout(1500),
            redirect: 'error',
          })
          if (response.ok) {
            const config = await response.json()
            metadata = {
              title: typeof config.title === 'string' ? config.title : fallback.title,
              description: typeof config.description === 'string' ? config.description : fallback.description,
            }
          }
        } catch {
          // Keep the UI available with last known/default metadata when the API is offline.
        } finally {
          expiresAt = Date.now() + 30_000
          pending = undefined
        }
        return metadata
      })()
    }
    return pending
  }
}
