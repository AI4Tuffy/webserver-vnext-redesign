# YINYU Webserver

独立的 YINYU 前端 Git 仓库：React 页面、生成 API 客户端、构建工具，以及 Node.js Web 服务均在本仓库内。运行和构建不需要读取原主站仓库。提取来源见 [EXTRACTION.json](EXTRACTION.json)。

```text
浏览器 → Webserver :3000
           ├── 页面与静态资源 → 本仓库 build/
           └── API / 附件 / SignalR / TeamLab → BACKEND_URL 指定的 GZCTF 后端
```

业务数据、登录、判题、运行环境仍由现有后端提供。后端离线时页面仍可加载，业务请求返回真实错误。原仓库未删除前端，也未修改生产部署；后续切换源码归属与发布流程时需要协调两边，避免双份源码长期漂移。

## 快速启动

要求 Node.js 24（至少 24.14）和 pnpm 11.25.0。

```powershell
pnpm install --frozen-lockfile
Copy-Item .env.example .env
# 编辑 .env 中的 BACKEND_URL，指向已运行的后端
pnpm build
pnpm start
```

访问 `http://127.0.0.1:3000`。`pnpm start` 托管生产构建，刷新 `/games/1/challenges` 等深链接也会返回应用入口。`/web-healthz` 只检查 Web 进程；`/healthz` 转发至后端，不将前端就绪冒充后端健康。

开发页面时运行 `pnpm dev`，访问 `http://localhost:63000`。同一份 `.env` 的 `BACKEND_URL` 用于开发代理和生产服务。`pnpm preview` 使用与 `pnpm start` 相同的生产 Web 服务。

## 配置

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `BACKEND_URL` | `http://127.0.0.1:8080` | 后端 origin，仅 HTTP/HTTPS，不带路径、凭据、查询参数 |
| `HOST` | `127.0.0.1` | Web 服务监听地址；容器设为 `0.0.0.0` |
| `PORT` | `3000` | Web 服务监听端口 |
| `TRUSTED_PROXIES` | 空 | 可信任的前置反向代理 IP/CIDR，逗号分隔 |

页面的标题和描述从后端 `/api/config` 读取，缓存 30 秒；失败时使用最近一次成功值或默认品牌。每次 HTML 响应生成独立 CSP nonce，HTML 不缓存，构建静态资源长期缓存。

浏览器只访问 Webserver 域名，登录 Cookie、上传、SSE 和 WebSocket 经同源代理转发。没有新增跨域登录流程。HTTPS 应由前置网关终止：网关保留原始 Host、设置转发头，并把其地址列入 `TRUSTED_PROXIES`；后端同时需要信任 Webserver 的代理地址。不要信任任意来源，也不要在浏览器环境变量中放后端密钥。

## 容器

```powershell
# BACKEND_URL 指向容器可访问的后端，而不是容器自身的 localhost
$env:BACKEND_URL = 'http://host.docker.internal:8080'
docker compose up --build -d
```

示例绑定宿主机 `127.0.0.1:3000`。已有 `.env` 时也应检查其后端地址，避免把本机开发的 `127.0.0.1:8080` 误用在容器中。镜像以非 root 用户运行，Compose 根文件系统只读。不包含数据库、Redis 或执行节点。

## 验证与开发入口

`pnpm build` 依次执行多语言、lint、TypeScript、架构检查、前端测试、Web 服务测试、Vite 构建和制品预算。Web 服务单独验证：`pnpm test:webserver`。

```text
src/main.tsx → src/App.tsx → src/vnext/app/VNextApp.tsx
src/vnext/features/      业务页面、控制器与 API adapter
src/vnext/shared/        公共交互和展示组件
src/vnext/design/        主题与设计 Token
src/generated/          OpenAPI 生成代码，禁止手改
server/                 静态托管、HTML 注入与后端代理
build/                  构建产物，不提交 Git
```

接口生成沿用 `pnpm genapi`，默认从本机后端 `http://localhost:8080/openapi/v1.json` 读取；其他地址可使用相同 `swagger-typescript-api` 命令指定 `-p`。接口变更应与后端协同，生成后审查差异。

完整文档见 [docs/README.md](docs/README.md)，开发约束见 [AGENTS.md](AGENTS.md)。
