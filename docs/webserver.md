# Web 服务边界

入口为 `server/index.mjs`，服务组合在 `server/app.mjs`。正式 React 路由与业务代码沿用提取时的 vNext，不改页面与接口契约。

## 请求分流

| 路径 | 处理 |
| --- | --- |
| `/api`、`/hub` | 转发原路径、查询、方法、认证头与请求体；允许 WebSocket upgrade |
| `/assets`、`/favicon.webp` | 转发后端附件与动态图标 |
| `/openapi`、`/api-docs`、`/swagger` | 转发后端接口定义和文档 |
| `/healthz`、`/metrics`、`/error`、`/agent` | 转发后端对应入口 |
| `/web-healthz` | Web 进程健康；不读取业务数据 |
| `/static/*` | 构建静态文件；缺失返回 404 |
| `/index.html`、前端深链接 | 注入元数据与 nonce 后返回 SPA HTML |
| 不存在的带扩展名路径、隐藏路径 | 404，不返回 SPA HTML |
| 对前端页面执行非 GET/HEAD 请求 | 405 |

开发代理与生产代理的路径清单共用 `server/routes.mjs`。代理不设置请求体解析器，不缓存业务响应，不把后端 401/403/404 转成首页；连接失败返回脱敏的 502。请求体和事件流保持流式传输。业务上传额度由后端负责。

## 认证与代理链

保留浏览器 Host，Cookie 的 Domain 改为当前站点 host-only，其余 Path、HttpOnly、Secure、SameSite 属性保留。部署时前后端应通过同一个外部 Web 域名访问。

默认丢弃来路提供的 Forwarded / X-Forwarded-*，用直连地址和协议重建转发信息。只有 `TRUSTED_PROXIES` 中的直接上游才允许传递已有客户端链与 HTTPS 协议。后端仍需正确配置 KnownProxies / KnownIPNetworks。

HTTP 和 WebSocket 使用相同的路径分流与转发头处理。独立控制台的页面由 Web 服务返回，实际会话通过 `/api/...` 代理；SignalR 通过 `/hub/...` 代理。

## HTML 与产物

Vite 继续输出 `build/`，独立 Web 服务从自身仓库相对路径读取，不依赖启动时的当前目录。启动时找不到 index.html 会明确失败。

后端 `/api/config` 提供公开品牌元数据，30 秒缓存并合并并发读取，单次读取超时 1.5 秒。标题和描述按 HTML 编码，模板占位符一次替换，避免元数据中类似占位符的文本被二次处理。元数据读取不转发用户 Cookie。

生产 CSP 延续原后端策略，每次生成随机 nonce；HTML 设置 no-store。开发服务只替换 HTML 占位符，不设置生产 CSP，保留 Vite HMR。

原仓库的前端源码及发布路径保留；本仓库的初始快照来自 EXTRACTION.json 的提交，之后的改动独立提交。主站停用旧前端构建、CI 转移及生产入口切换应作为后续集成任务处理，不由本地提取自动完成。

## 测试边界

`server/app.test.mjs` 使用真实本地 HTTP/TCP 监听验证静态资源、深链接、nonce、Cookie、上传、SSE、WebSocket、代理信任和错误响应。它不替代真实账户登录、Docker/VM、TeamLab 控制台和生产网关验收。

依赖接口参考：[Express 静态托管](https://expressjs.com/en/resources/middleware/serve-static/)、[http-proxy-middleware](https://github.com/chimurai/http-proxy-middleware/tree/v3.0.10)。
