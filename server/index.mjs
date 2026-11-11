import { createWebServer } from './app.mjs'

const port = Number(process.env.PORT || 3000)
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be between 1 and 65535.')
const host = process.env.HOST || '127.0.0.1'
const server = createWebServer({
  backendUrl: process.env.BACKEND_URL,
  trustedProxies: (process.env.TRUSTED_PROXIES || '').split(',').map((value) => value.trim()).filter(Boolean),
})
const sockets = new Set()
server.on('connection', (socket) => {
  sockets.add(socket)
  socket.once('close', () => sockets.delete(socket))
})
server.listen(port, host, () => console.log(`YINYU Web server listening on http://${host}:${port}`))
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    server.close(() => process.exit(0))
    setTimeout(() => {
      for (const socket of sockets) socket.destroy()
    }, 10_000).unref()
  })
}
