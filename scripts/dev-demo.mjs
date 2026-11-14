// 本地演示开发启动：先启动内存演示 API，再以它为后端启动 Vite 开发服务器。
//
//   pnpm dev:demo                     # http://127.0.0.1:5189
//   PORT=5200 pnpm dev:demo           # 换端口
//   YINYU_DEMO_DIR=/path/to/server/demo pnpm dev:demo
//
// 演示 API 位于主工作目录 `codex/local-demo` 分支的 server/demo（默认 ../webserver/server/demo），
// 本仓库不复制它。两个服务都只监听 127.0.0.1；Ctrl+C 会同时关闭。

import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { existsSync } from 'node:fs'
import { createServer } from 'node:http'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const host = '127.0.0.1'
const port = Number(process.env.PORT || 5189)
const demoDir = resolve(process.env.YINYU_DEMO_DIR || join(root, '..', 'webserver', 'server', 'demo'))
const demoEntry = join(demoDir, 'api.mjs')

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('PORT 必须是 1 至 65535 之间的整数。')
  process.exit(1)
}
if (!existsSync(demoEntry)) {
  console.error(`找不到演示 API：${demoEntry}`)
  console.error('请确认主工作目录处于 codex/local-demo 分支，或用 YINYU_DEMO_DIR 指向 server/demo 目录。')
  process.exit(1)
}

const { createDemoApi } = await import(pathToFileURL(demoEntry).href)
const api = createServer(createDemoApi())
api.listen(0, host)
await once(api, 'listening')
const backendUrl = `http://${host}:${api.address().port}`
console.log(`演示 API 已启动 ${backendUrl}`)

const vite = spawn(
  process.execPath,
  [join(root, 'node_modules', 'vite', 'bin', 'vite.js'), '--host', host, '--port', String(port), '--strictPort'],
  { cwd: root, env: { ...process.env, BACKEND_URL: backendUrl }, stdio: 'inherit' }
)

let stopping = false
function stop(code = 0) {
  if (stopping) return
  stopping = true
  if (vite.exitCode === null) vite.kill()
  api.close()
  api.closeAllConnections()
  process.exitCode = code
}

vite.on('exit', (code) => stop(code ?? 0))
vite.on('error', (error) => {
  console.error(`Vite 启动失败：${error.message}`)
  stop(1)
})
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => stop(0))
