import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { once } from 'node:events'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { connect } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { createWebServer } from './app.mjs'
import { backendOrigin } from './routes.mjs'

const template = '<html lang="%lang%"><title>%title%</title><meta name="description" content="%description%"><meta property="csp-nonce" nonce="%nonce%"><script nonce="%nonce%" src="/static/app.js"></script><div id="root"></div></html>'

async function listen(server, context) {
  const sockets = new Set()
  server.on('connection', (socket) => {
    sockets.add(socket)
    socket.on('close', () => sockets.delete(socket))
  })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  context.after(async () => {
    for (const socket of sockets) socket.destroy()
    await new Promise((done) => server.close(done))
  })
  return `http://127.0.0.1:${server.address().port}`
}

async function fixture(context, options = {}) {
  const directory = await mkdtemp(join(tmpdir(), 'yinyu-webserver-test-'))
  context.after(() => rm(directory, { recursive: true, force: true }))
  await mkdir(join(directory, 'static'))
  await writeFile(join(directory, 'index.html'), template)
  await writeFile(join(directory, 'static/app.js'), 'window.appLoaded = true;')
  await writeFile(join(directory, '.secret'), 'must not be served')
  const requests = []
  const backend = createServer(async (request, response) => {
    requests.push({ url: request.url, headers: request.headers, method: request.method })
    if (request.url === '/api/config') {
      response.setHeader('Content-Type', 'application/json')
      return response.end(JSON.stringify({ title: '<test> & "title"', description: 'Description %nonce% <safe>' }))
    }
    if (request.url === '/api/events') {
      response.writeHead(200, { 'Content-Type': 'text/event-stream' })
      response.write('data: first\n\n')
      const timer = setTimeout(() => response.end('data: last\n\n'), 10_000)
      response.on('close', () => clearTimeout(timer))
      return
    }
    if (request.url === '/api/missing') {
      response.writeHead(404, { 'Content-Type': 'application/json' })
      return response.end('{"message":"missing"}')
    }
    if (request.url === '/api/redirect') {
      response.writeHead(302, { Location: '/account/login?returnUrl=%2Fgames' })
      return response.end()
    }
    const body = []
    for await (const chunk of request) body.push(chunk)
    response.setHeader('Set-Cookie', ['session=fixture; Path=/; HttpOnly; SameSite=Lax; Domain=backend.internal', 'other=fixture; Path=/; HttpOnly'])
    response.setHeader('Content-Type', 'application/json')
    response.end(JSON.stringify({ url: request.url, method: request.method, body: Buffer.concat(body).toString() }))
  })
  backend.on('upgrade', (request, socket) => {
    requests.push({ url: request.url, headers: request.headers, method: 'UPGRADE' })
    const accept = createHash('sha1').update(request.headers['sec-websocket-key'] + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64')
    socket.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\n\r\n`)
    const payload = Buffer.from('upstream websocket ready')
    socket.write(Buffer.concat([Buffer.from([0x81, payload.length]), payload]))
  })
  const backendUrl = await listen(backend, context)
  const server = createWebServer({ backendUrl, buildDir: directory, ...options })
  const origin = await listen(server, context)
  return { origin, requests, backend }
}

test('SPA deep links and index inject escaped metadata and a fresh matching CSP nonce', async (context) => {
  const { origin } = await fixture(context)
  const nonces = []
  for (const path of ['/', '/index.html', '/%69ndex.html', '/INDEX.HTML', '/games/42/challenges', '/training/courses/3/chapters/2', '/admin/teamlab/environments/env/console/asset/ssh']) {
    const response = await fetch(origin + path)
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('cache-control'), 'no-store')
    const html = await response.text()
    assert.match(html, /&lt;test&gt; &amp; &quot;title&quot;/)
    assert.match(html, /Description %nonce% &lt;safe&gt;/)
    const nonce = html.match(/<script nonce="([^"]+)"/)[1]
    assert.ok(response.headers.get('content-security-policy').includes(`'nonce-${nonce}'`))
    nonces.push(nonce)
  }
  assert.equal(new Set(nonces).size, nonces.length)
})

test('static assets get cache/MIME headers; missing files and dotfiles never become HTML', async (context) => {
  const { origin } = await fixture(context)
  const asset = await fetch(`${origin}/static/app.js`)
  assert.equal(asset.status, 200)
  assert.match(asset.headers.get('content-type'), /javascript/)
  assert.match(asset.headers.get('cache-control'), /immutable/)
  for (const path of ['/static/missing.js', '/static/missing', '/missing.css', '/.secret', '/.git/config', '/%2esecret']) {
    const response = await fetch(origin + path)
    assert.equal(response.status, 404, path)
    assert.doesNotMatch(await response.text(), /<html|must not be served/)
  }
})

test('health, HEAD, malformed URL and unsupported method responses remain explicit', async (context) => {
  const { origin } = await fixture(context)
  assert.equal((await (await fetch(origin + '/web-healthz')).json()).service, 'yinyu-webserver')
  const head = await fetch(origin + '/games/1', { method: 'HEAD' })
  assert.equal(head.status, 200)
  assert.equal(await head.text(), '')
  assert.equal((await fetch(origin + '/games/1', { method: 'POST' })).status, 405)
  assert.equal((await fetch(origin + '/%FF')).status, 400)
})

test('API forwards method, query, upload bytes, auth and cookies without parsing the body', async (context) => {
  const { origin, requests } = await fixture(context)
  const body = '--boundary\r\nContent-Disposition: form-data; name="file"\r\n\r\nfixture\r\n--boundary--'
  const response = await fetch(origin + '/api/upload?name=test', {
    method: 'POST', body,
    headers: { 'Content-Type': 'multipart/form-data; boundary=boundary', Cookie: 'session=fixture', Authorization: 'Bearer fixture' },
  })
  const result = await response.json()
  assert.equal(result.body, body)
  assert.equal(result.method, 'POST')
  assert.equal(result.url, '/api/upload?name=test')
  assert.equal(requests[0].headers.cookie, 'session=fixture')
  assert.equal(requests[0].headers.authorization, 'Bearer fixture')
  assert.equal(requests[0].headers.host, new URL(origin).host)
  const cookies = response.headers.getSetCookie()
  assert.equal(cookies.length, 2)
  assert.ok(cookies.every((cookie) => !/domain=/i.test(cookie)))
  assert.match(cookies[0], /HttpOnly; SameSite=Lax/)
})

test('all backend namespaces, errors and redirects bypass SPA fallback', async (context) => {
  const { origin } = await fixture(context)
  for (const path of ['/assets/hash/file.zip', '/hub/user/negotiate', '/openapi/v1.json', '/api-docs', '/favicon.webp', '/healthz', '/API/Config', '/api/teamlab/netlab/admin/api/v1/environments']) {
    const response = await fetch(origin + path)
    assert.equal(response.status, 200, path)
    assert.equal((await response.json()).url, path)
  }
  const missing = await fetch(origin + '/api/missing')
  assert.equal(missing.status, 404)
  assert.deepEqual(await missing.json(), { message: 'missing' })
  const redirect = await fetch(origin + '/api/redirect', { redirect: 'manual' })
  assert.equal(redirect.status, 302)
  assert.equal(redirect.headers.get('location'), '/account/login?returnUrl=%2Fgames')
})

test('untrusted forwarded headers cannot spoof client address or scheme', async (context) => {
  const { origin, requests } = await fixture(context)
  await fetch(origin + '/api/echo', { headers: { 'X-Forwarded-For': '203.0.113.1', 'X-Forwarded-Proto': 'https', Forwarded: 'for=203.0.113.1', 'X-Forwarded-Host': 'untrusted.invalid' } })
  assert.equal(requests[0].headers['x-forwarded-for'], '127.0.0.1')
  assert.equal(requests[0].headers['x-forwarded-proto'], 'http')
  assert.equal(requests[0].headers['x-forwarded-host'], new URL(origin).host)
  assert.equal(requests[0].headers.forwarded, undefined)
})

test('explicitly trusted edge preserves original HTTPS scheme and client chain', async (context) => {
  const { origin, requests } = await fixture(context, { trustedProxies: ['loopback'] })
  await fetch(origin + '/api/echo', { headers: { 'X-Forwarded-For': '203.0.113.1', 'X-Forwarded-Proto': 'https' } })
  assert.equal(requests[0].headers['x-forwarded-for'], '203.0.113.1, 127.0.0.1')
  assert.equal(requests[0].headers['x-forwarded-proto'], 'https')
})

test('SSE sends the first event before the upstream response completes', async (context) => {
  const { origin } = await fixture(context)
  const abort = new AbortController()
  const timeout = setTimeout(() => abort.abort(), 2000)
  try {
    const response = await fetch(origin + '/api/events', { signal: abort.signal })
    assert.match(response.headers.get('content-type'), /text\/event-stream/)
    const { value } = await response.body.getReader().read()
    assert.equal(new TextDecoder().decode(value), 'data: first\n\n')
  } finally { clearTimeout(timeout); abort.abort() }
})

async function websocketHandshake(origin, path) {
  const socket = connect(Number(new URL(origin).port), '127.0.0.1')
  await once(socket, 'connect')
  return new Promise((resolve, reject) => {
    let received = ''
    const timeout = setTimeout(() => { socket.destroy(); reject(new Error('WebSocket timeout')) }, 2000)
    socket.on('error', reject)
    socket.on('data', (chunk) => {
      received += chunk.toString()
      if (received.includes('upstream websocket ready') || received.startsWith('HTTP/1.1 404')) {
        clearTimeout(timeout)
        socket.destroy()
        resolve(received)
      }
    })
    socket.write(`GET ${path} HTTP/1.1\r\nHost: ${new URL(origin).host}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Version: 13\r\nSec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\nCookie: session=fixture\r\n\r\n`)
  })
}

test('SignalR and TeamLab WebSocket upgrades work before the first HTTP request', async (context) => {
  const { origin, requests } = await fixture(context)
  for (const path of ['/hub/user?game=1', '/api/teamlab/netlab/admin/api/v1/console?session=fixture']) {
    const response = await websocketHandshake(origin, path)
    assert.match(response, /^HTTP\/1.1 101/)
    assert.match(response, /upstream websocket ready/)
    assert.equal(requests.at(-1).url, path)
    assert.equal(requests.at(-1).headers.cookie, 'session=fixture')
  }
  assert.match(await websocketHandshake(origin, '/games/1'), /^HTTP\/1.1 404/)
})

test('unavailable backend returns 502 while frontend stays available', async (context) => {
  const { origin, backend } = await fixture(context, { metadataReader: async () => ({ title: 'Offline', description: 'UI available' }) })
  await new Promise((done) => backend.close(done))
  const response = await fetch(origin + '/api/config')
  assert.equal(response.status, 502)
  assert.deepEqual(await response.json(), { message: '后端服务暂时不可用。' })
  assert.equal((await fetch(origin + '/games')).status, 200)
})

test('backend configuration accepts only fixed HTTP origins', () => {
  assert.equal(backendOrigin('https://backend.example/'), 'https://backend.example')
  for (const input of ['file:///tmp', 'http://user:password@localhost', 'http://localhost/api', 'http://localhost?q=1', 'http://localhost/#fragment']) {
    assert.throws(() => backendOrigin(input))
  }
})
