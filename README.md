# CodeRushOJ Frontend

CodeRushOJ 的 Vue 3 Web 应用，提供用户端和管理端界面。当前实现覆盖登录注册、邮箱验证、个人资料、题目列表与详情、Monaco 代码编辑器、提交查询、论坛与评论、题解发布与阅读、全局公告，以及用户/题目/标签/公告管理页面。

## 技术栈

- Vue 3 + Vite 8
- Vue Router + 路由权限守卫
- Pinia + 持久化状态
- Element Plus
- Monaco Editor（C++、Java、Python、JavaScript、Go）
- Vue I18n（中文/英文）
- Axios API client
- Vitest + Vue Testing Library 组件测试
- Sass 主题与组件样式

## 目录

```text
src/
├── api/          # 后端 API 模块与 Axios 拦截器
├── components/   # 代码编辑器、社区卡片、异步状态等复用组件
├── router/       # 路由、鉴权与管理员守卫
├── store/        # Pinia 应用和认证状态
├── locales/      # 中英文文案
├── views/        # 用户端、认证页和管理端页面
└── assets/       # 全局、布局、认证与 Element Plus 样式
```

开发服务器把 `/api` 和 `/uploads` 代理到 `http://localhost:7999`。生产环境由 `croj-platform` Gateway API 将前端和后端路由到各自 Kubernetes Service。

## 本地开发

推荐 Node.js 22 和 pnpm 9：

```bash
corepack enable
corepack prepare pnpm@9 --activate
pnpm install --frozen-lockfile
pnpm dev
```

打开 <http://localhost:3000>。后端默认监听 `http://localhost:7999/api`。
前端主路径不提供 mock 账号或 mock 题目；请先按平台仓库文档启动真实依赖和后端。需要从局域网访问开发服务器时使用 `pnpm dev:network`。

宿主机不安装 Node.js 时可使用容器：

```bash
docker run --rm -it \
  -p 3000:3000 \
  -v "$PWD:/workspace" \
  -w /workspace node:22-bookworm \
  sh -c 'corepack enable && corepack prepare pnpm@9 --activate && pnpm install --frozen-lockfile && pnpm dev --host 0.0.0.0'
```

## 配置

前端环境变量必须以 `VITE_` 开头。不要在前端环境变量或构建产物中放置数据库密码、JWT Secret、SMTP 授权码等服务端凭据。

| 变量 | 用途 | 开发默认值 |
| --- | --- | --- |
| `VITE_I18N_LOCALE` | 默认语言 | `zh-CN` |
| `VITE_I18N_FALLBACK_LOCALE` | 回退语言 | `en` |

Axios 当前固定使用同源 `/api`，由 Vite/Gateway 代理；历史 `.env` 中的 `VITE_API_URL` 尚未被代码读取。仓库 `.env` 仅用于本地开发，部署值由镜像构建和平台配置管理。

## 质量检查

```bash
pnpm lint
pnpm test:run
pnpm build
pnpm audit --audit-level high
```

社区模块已经沉淀 API 契约与组件交互测试。新增功能必须同步添加 Vitest 组件测试或 Playwright 流程测试；CI 应强制执行 lint、测试和生产构建。

## 管理端题目导入

管理员从头像菜单进入“管理工作台”，再打开“题目导入”。页面使用真实后端 API，不包含浏览器端 mock 或仅预览数据：

1. 选择 `.xml` 或 `.zip` 题目包。
2. 前端以 multipart 请求上传到 `POST /api/v1/admin/problem-imports/preflight`。
3. 服务端负责格式探测、归档安全校验、题面与测试数据解析，并返回文件 SHA-256、题目/测试用例数量、逐题错误和警告。
4. 只有全局和逐题错误均为空时，页面才允许调用 `POST /api/v1/admin/problem-imports/{jobId}/commit`。
5. 上传或确认失败时保留当前文件/预检任务，管理员可以直接重试，不会假装已经导入成功。

上传和提交使用 5 分钟请求期限；预检期间可以主动取消，取消不会显示为网络故障。

第一阶段以 [FreeProblemSet](https://github.com/zhblue/freeproblemset/tree/master) XML 为基准格式；ZIP 是安全归档载体，具体内容仍由后端适配器识别。后续 Polygon、DOMjudge、Hydro/QDUOJ 等格式通过相同预检响应契约扩展，前端不根据文件名伪判格式。解析、压缩炸弹/路径穿越防护、大小上限、重复题策略和测试包不可变发布都必须由后端强制执行。

API 响应中的预检核心字段为：

```text
jobId, detectedFormat, sha256, problemCount, testCaseCount,
errors[], warnings[], problems[]
```

`problems[]` 展示 `sourceId`、标题、测试用例数、状态以及逐题错误/警告。确认响应返回实际 `importedCount`。

## 管理端测试包发布

管理员可在“题目管理”的每一题操作区进入“测试包”，或直接打开 `/admin/test-bundles?problemId={id}`。页面通过真实 API 列出该题版本，只把 `DRAFT` 版本作为可选发布目标：

- `GET /api/v1/admin/problems/{problemId}/versions`
- `GET /api/v1/admin/problems/{problemId}/versions/{versionId}/test-bundle`
- `PUT /api/v1/admin/problems/{problemId}/versions/{versionId}/test-bundle`
- `POST /api/v1/admin/problems/{problemId}/versions/{versionId}/test-bundle/publish`

元数据响应的强 ETag 会随上传结果更新，并作为下一次上传或发布的 `If-Match`。HTTP 412 会保留已选 ZIP，必须由管理员显式刷新；400、403、404、409、413、422 与 428 都有独立状态。上传使用 5 分钟期限并支持取消。浏览器不解析或伪造测试包，格式、大小、归档安全和不可变发布均由服务端强制执行。

## 论坛与题解 API

Axios 的 `baseURL` 是同源 `/api`，社区请求集中在 `src/api/community.js`：

- `GET/POST /api/v1/forum/posts`
- `GET /api/v1/forum/categories`
- `GET /api/v1/forum/posts/{postId}`
- `GET/POST /api/v1/forum/posts/{postId}/comments`
- `GET/POST /api/v1/problems/{problemId}/solutions`
- `GET /api/v1/problems/{problemId}/solutions/{solutionId}`

`community.js` 在边界上把页面的 `content` 模型映射为后端 `contentMarkdown` DTO，并把 `authorName`、`publishedAt` 等 VO 字段规范化后再交给组件。论坛列表、帖子详情和题解详情允许匿名阅读；发布、评论和题解写入仍需要登录。页面支持加载骨架、空态、可重试错误态和移动端单列布局。正文以纯文本安全呈现；当前 MVP 不引入富文本和付费能力。

题目详情中的“讨论”标签固定以 `resourceType=PROBLEM&resourceId={problemId}` 读取帖子，发布时也显式提交同一关联，避免题目讨论混入全局论坛。全局论坛默认使用 `GENERAL` 且不携带 `resourceId`。

## 全局公告

公开顶部导航提供“公告”入口，并在存在当前公告时显示轻量提示条。公开页面调用真实后端接口：

- `GET /api/v1/announcements?page=1&size=20`
- `GET /api/v1/announcements/current?limit=1`
- `GET /api/v1/announcements/{announcementId}`

管理员仍从头像菜单进入管理工作台，在 `/admin/announcements` 创建或编辑草稿、设置置顶顺序、排期、立即发布、撤回和归档。管理变更使用列表返回的 `version` 发送 `If-Match: "<version>"`。HTTP 409 时页面保留未保存输入，不会静默覆盖或重试；管理员明确选择“刷新服务器版本”后才替换编辑快照。排期输入使用浏览器本地时区，提交前转换为带时区的 ISO-8601 UTC Instant。HTTP 403、加载失败、空列表与生命周期错误均有独立页面状态。

公告正文暂以安全纯文本方式呈现 Markdown 源，不执行原始 HTML，避免把未审计内容带入 DOM。

## 部署

生产构建输出位于 `dist/`：

```bash
pnpm build
pnpm preview --host 0.0.0.0
```

正式 Docker 镜像、Nginx 静态资源配置、Gateway 路由、Secret/ConfigMap 和 Kubernetes 部署由 [`croj-platform`](https://github.com/CodeRushOJ/croj-platform) 统一管理。完整系统安装请从平台仓库的快速开始进入。

## 功能状态

- 已有：认证、邮箱验证、题目浏览、代码编辑、基础提交、论坛、评论、题解、全局公告、公告发布工作台、个人设置、管理端基础页面、题目包预检/确认导入界面、主题和国际化。
- 迭代中：真实判题状态体验、响应式视觉统一、错误/空/加载状态、无障碍与性能优化。
- 待实现：排行榜、举报审核、通知中心和端到端浏览器测试。
- 不在 v1 范围：付费、订阅和商业计费。

需求通过 GitHub Issues 管理，改动使用 `codex/*` 分支和 Draft PR。发布遵循平台 SemVer 与跨仓库发版日志。
