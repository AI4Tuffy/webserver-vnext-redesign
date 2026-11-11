# YINYU Webserver 协作规范

先读本文件、README.md、docs/README.md 与相关任务记录。提取基线见 EXTRACTION.json；当前 Git 与真实测试优先于历史说明。

- 本仓库只维护 Web 客户端和 Web 服务。业务 API、数据库、Agent、Netlab 执行面仍属于原主站或独立底座。
- 正式前端位于 src/vnext。保持 Route → controller/hook → panel → shared 的依赖方向，业务请求在 feature adapter 中。
- 使用语义 Token、CSS Module 与现有 shared/design。TeamLab workspace 保留迁入的 Mantine 依赖与局部样式。
- 不引回旧页面或旧壳层，不伪造业务数据与成功结果，不手工修改生成 API。
- 修改视觉时检查日夜主题、键盘、减少动效，以及 390、1366、1920、2560 宽度。
- 服务端代理保持同源 Cookie、上传流、SSE 和 WebSocket；不可记录凭据、Cookie、Flag 或完整请求体。
- .env、node_modules、build、测试产物不得提交。保留已有第三方版权与许可证文件。
- 每项任务使用 codex/ 分支，不覆盖他人改动，不 force push。并行任务使用不同工作目录。
- 验证：pnpm build、git diff --check；仅文档变更可跳过构建。记录未执行的检查和真实基础设施边界。
- 当前用户明确要求仅本地 Git 仓库：不创建远端、不推送、不创建 PR、不部署。后续改变这些动作需要新的授权。
- 文档使用简体中文。复杂任务在 docs/records 下保留目标、决定、验证与交接，文档导航维护在 docs/README.md。
