import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, resolve } from 'node:path'
import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { backendOrigin, isBackendPath } from './routes.mjs'
import { createMetadataReader, defaultMetadata, renderIndex } from './html.mjs'

export function createWebServer({
  backendUrl = 'http://127.0.0.1:8080',
  buildDir = resolve(import.meta.dirname, '../build'),
  trustedProxies = [],
  metadataReader,
} = {}) {
  const target = backendOrigin(backendUrl)
  // Fail at startup rather than quietly serving an empty/missing frontend.
  const template = readFileSync(resolve(buildDir, 'index.html'), 'utf8')
  const readMetadata = metadataReader ?? createMetadataReader(target, defaultMetadata)
  const app = express()
  app.disable('x-powered-by')
  app.disable('etag')
  app.set('trust proxy', trustedProxies)

  function prepareForwardedHeaders(request) {
    const trusted = app.get('trust proxy fn')(request.socket.remoteAddress, 0)
    const forwardedFor = trusted ? request.headers['x-forwarded-for'] : undefined
    const forwardedProto = trusted ? request.headers['x-forwarded-proto']?.split(',')[0].trim() : undefined
    for (const name of Object.keys(request.headers)) {
      if (name === 'forwarded' || name.startsWith('x-forwarded-')) delete request.headers[name]
    }
    request.headers['x-forwarded-for'] = [forwardedFor, request.socket.remoteAddress].filter(Boolean).join(', ')
    request.headers['x-forwarded-proto'] = ['http', 'https'].includes(forwardedProto)
      ? forwardedProto : request.socket.encrypted ? 'https' : 'http'
    request.headers['x-forwarded-host'] = request.headers.host
  }

  const proxy = createProxyMiddleware({
    target,
    changeOrigin: false,
    xfwd: false,
    // Explicit upgrade handling below also supports sockets opened before any HTTP request.
    ws: false,
    cookieDomainRewrite: '',
    on: {
      error: (_error, _request, response) => {
        // No request URLs, cookies, tokens or backend exception details in logs/responses.
        if ('writeHead' in response && !response.headersSent) {
          response.writeHead(502, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
          response.end(JSON.stringify({ message: '后端服务暂时不可用。' }))
        } else response.destroy()
      },
    },
  })

  app.use((request, response, next) => {
    response.setHeader('X-Content-Type-Options', 'nosniff')
    let pathname
    try { pathname = decodeURIComponent(request.path) } catch {
      return response.status(400).end()
    }
    if (isBackendPath(pathname)) {
      prepareForwardedHeaders(request)
      return proxy(request, response, next)
    }
    next()
  })
  app.get('/web-healthz', (_request, response) => {
    response.setHeader('Cache-Control', 'no-store')
    response.json({ status: 'ok', service: 'yinyu-webserver' })
  })

  const index = async (request, response) => {
    if (!['GET', 'HEAD'].includes(request.method)) return response.status(405).set('Allow', 'GET, HEAD').end()
    const { html, csp } = renderIndex(template, await readMetadata())
    response.set({ 'Content-Security-Policy': csp, 'Cache-Control': 'no-store' }).type('html').send(html)
  }
  // index.html must pass through nonce injection, never static middleware.
  app.use((request, response, next) => {
    const pathname = decodeURIComponent(request.path).replaceAll('\\', '/')
    if (/^\/index\.html$/i.test(pathname)) return index(request, response).catch(next)
    // Never expose an unrendered HTML template through an encoded/alternate path.
    if (/\.html?$/i.test(pathname)) return response.status(404).end()
    next()
  })
  app.use(express.static(buildDir, {
    index: false,
    redirect: false,
    dotfiles: 'deny',
    setHeaders(response, path) {
      const immutable = path.replaceAll('\\', '/').includes('/static/')
      response.setHeader('Cache-Control', immutable ? 'public, max-age=31536000, immutable' : 'no-cache')
    },
  }))
  app.use((request, response, next) => {
    const pathname = decodeURIComponent(request.path)
    if (pathname.split('/').some((part) => part.startsWith('.')) ||
        /^\/static(?:\/|$)/i.test(pathname) || extname(pathname)) return response.status(404).end()
    return index(request, response).catch(next)
  })
  app.use((_error, _request, response, _next) => {
    if (response.headersSent) return response.destroy()
    response.status(500).json({ message: '网页服务暂时不可用。' })
  })

  const server = createServer(app)
  // Upload limits/timeouts are enforced by the API; do not buffer image uploads or SSE.
  server.requestTimeout = 0
  server.on('upgrade', (request, socket, head) => {
    let pathname
    try { pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname) } catch {
      socket.end('HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n')
      return
    }
    if (!isBackendPath(pathname)) {
      socket.end('HTTP/1.1 404 Not Found\r\nConnection: close\r\n\r\n')
      return
    }
    prepareForwardedHeaders(request)
    proxy.upgrade(request, socket, head)
  })
  return server
}
