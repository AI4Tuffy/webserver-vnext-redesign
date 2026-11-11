# Webserver 独立仓库提取

状态：本地独立仓库交付完成。负责人：Codex。

## 目标与授权

- 用户要求将网页拆到另一个独立 Git 仓库，并明确仅创建本地仓库。
- 路径：与 newGZCTF 同级的 webserver；不创建远端、不推送、不部署。
- 来源 main：`2d1d236f5eabb7d69eef1fd4ee77861ec51ce260`，源码目录 `src/GZCTF/ClientApp`。
- 提取 994 个已跟踪前端文件，排除 .env；原历史留在主仓库，来源信息保存在 EXTRACTION.json。
- 原仓库源码和生产服务不变。新仓库 main 保存提取快照，开发分支为 codex/standalone-webserver。

## 实现决定

- 保留完整 React、API 客户端和构建工具，不产生跨仓库文件依赖。
- 增加 Node.js Web 服务，处理 SPA 深链接、动态元数据、CSP nonce 与同源代理。
- 代理支持 API、附件、SignalR、TeamLab WebSocket、SSE 与流式上传。
- 配置开发启动、生产启动、Dockerfile 和 Compose；.env.example 仅含本地示例。
- 保留现有前端测试与构建门禁，新增真实本地 HTTP/TCP 代理测试。

## 验证与交付

- `pnpm build` 通过：locale、lint（0 warning / 0 error）、strict TypeScript、架构检查、76 个前端测试文件 / 238 项测试、11 项 Web 服务测试、Vite 构建与制品预算。
- 生成 272 个前端文件；原有 elk worker 超过建议预算，但未超过硬预算，构建通过。
- `pnpm install --frozen-lockfile --offline` 通过；前端既有依赖版本未升级，新运行依赖为 Express 5.3.0 和 http-proxy-middleware 3.0.10。
- 生产 HTTP 冒烟通过：6 条页面深链接、272 个制品文件读取及文件长度、缺失静态资源 404、后端离线 502。
- 浏览器确认首页渲染、导航到赛事页和直接刷新；无浏览器错误日志。后端离线时业务区显示加载失败，未用模拟数据填充页面。
- `docker compose config --quiet`、本地 Markdown 链接检查与 `git diff --check` 通过。
- Docker Engine 当前未运行，容器构建与运行未执行。未运行后端 .NET 测试，因为未修改后端源码。
- 未连接生产后端，真实登录、课程实例、比赛和 TeamLab 业务未验收。
- 新仓库仅本地提交，无 remote、未推送、未部署。原主仓库已恢复到任务开始时的本地 main，工作树干净。
- 后续集成边界见 [Web 服务边界](../webserver.md)，不把本地服务测试当作业务验收。
