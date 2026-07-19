# CodeRushOJ Frontend

CodeRushOJ 的 Vue 3 Web 应用，提供用户端和管理端界面。当前实现覆盖登录注册、邮箱验证、个人资料、题目列表与详情、Monaco 代码编辑器、提交查询、论坛与评论、题解发布与阅读，以及用户/题目/标签管理基础页面。

## 技术栈

- Vue 3 + Vite 5
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

需要在后端尚未启动时检查受保护页面，可启动仅本机开发使用的预览模式：

```bash
pnpm dev:preview
```

打开 `http://localhost:3000`，在登录页点击“以预览管理员身份进入”。这个入口只在 Vite `preview` mode 且显式开关为 true 时编译启用；常规 `pnpm dev` 与 production build 都不会提供 mock 管理员。它只绕过前端路由认证，不会伪造后端 API 数据。

推荐 Node.js 22 和 pnpm 9：

```bash
corepack enable
corepack prepare pnpm@9 --activate
pnpm install --frozen-lockfile
pnpm dev
```

打开 <http://localhost:3000>。后端默认监听 `http://localhost:7999/api`。

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
```

社区模块已经沉淀 API 契约与组件交互测试。新增功能必须同步添加 Vitest 组件测试或 Playwright 流程测试；CI 应强制执行 lint、测试和生产构建。

## 论坛与题解 API

Axios 的 `baseURL` 是同源 `/api`，社区请求集中在 `src/api/community.js`：

- `GET/POST /api/v1/forum/posts`
- `GET /api/v1/forum/categories`
- `GET /api/v1/forum/posts/{postId}`
- `GET/POST /api/v1/forum/posts/{postId}/comments`
- `GET/POST /api/v1/problems/{problemId}/solutions`
- `GET /api/v1/problems/{problemId}/solutions/{solutionId}`

`community.js` 在边界上把页面的 `content` 模型映射为后端 `contentMarkdown` DTO，并把 `authorName`、`publishedAt` 等 VO 字段规范化后再交给组件。论坛列表、帖子详情和题解详情允许匿名阅读；发布、评论和题解写入仍需要登录。页面支持加载骨架、空态、可重试错误态和移动端单列布局。正文以纯文本安全呈现；当前 MVP 不引入富文本和付费能力。

## 部署

### 生产镜像

生产镜像使用锁定 digest 的 Node 22 构建阶段和官方 nginx-unprivileged runtime。依赖安装严格读取 `pnpm-lock.yaml`，Vite 始终以 `production` mode 构建；`VITE_ENABLE_PREVIEW_MOCK_AUTH` 在镜像构建中固定为 `false`，即使调用方传入同名 build argument 也不能启用预览管理员，产物检查还会拒绝包含预览 token 的 bundle。

```bash
docker build \
  --build-arg VCS_REF="$(git rev-parse HEAD)" \
  --build-arg VERSION=0.1.0 \
  -t coderushoj/croj-frontend:dev .

# 构建并执行镜像元数据、non-root、只读根文件系统、health、SPA、
# 缓存头、安全头和 /api 误路由契约测试；测试容器结束后自动删除。
./tests/container-contract.sh coderushoj/croj-frontend:dev
```

runtime 固定为 UID/GID `101:101`，监听 `8080`，并提供无外部依赖的 `GET /healthz`。Kubernetes 使用只读根文件系统时，只需为 Nginx 的显式写入目录提供内存卷：

```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 101
  runAsGroup: 101
  readOnlyRootFilesystem: true
  allowPrivilegeEscalation: false
  capabilities:
    drop: ["ALL"]
volumeMounts:
  - { name: tmp, mountPath: /tmp }
  - { name: nginx-cache, mountPath: /var/cache/nginx }
  - { name: nginx-run, mountPath: /var/run }
volumes:
  - { name: tmp, emptyDir: {} }
  - { name: nginx-cache, emptyDir: {} }
  - { name: nginx-run, emptyDir: {} }
```

Nginx 对 Vue Router history URL 使用 `index.html` fallback，对带 hash 的 `/assets/` 文件返回一年 immutable cache；HTML 不缓存，并统一设置 CSP、`nosniff`、frame、referrer 和 permissions policy。`/api` 与 `/uploads` 不配置容器内 upstream：生产流量由 `croj-platform` Gateway API 按同源路径转发到 backend；若这些路径被误发到 frontend Service，Nginx 返回 `404`，不会伪装成 SPA 页面。

### CI 与发布

Pull Request CI 在前端 lint/test/build 后构建镜像，以 UID `101` 和只读根文件系统运行容器契约，使用 Trivy 的已修复安全版本扫描 HIGH/CRITICAL 漏洞，并上传 SPDX JSON SBOM。所有第三方 Actions 都锁定完整 commit SHA。

合并到 `main` 或推送 `v*` tag 后，CI 才使用最小 `packages: write` 权限发布 `linux/amd64` 与 `linux/arm64` 镜像到 `ghcr.io/coderushoj/croj-frontend`，同时生成 BuildKit provenance 和 SBOM attestation。PR 不登录 GHCR、也不发布镜像。

### 仅构建静态文件

生产构建输出仍位于 `dist/`：

```bash
pnpm build
pnpm preview --host 0.0.0.0
```

Gateway 路由和 Kubernetes Deployment 由 [`croj-platform`](https://github.com/CodeRushOJ/croj-platform) 统一管理。完整系统安装请从平台仓库的快速开始进入。

## 功能状态

- 已有：认证、邮箱验证、题目浏览、代码编辑、基础提交、论坛、评论、题解、个人设置、管理端基础页面、主题和国际化。
- 迭代中：真实判题状态体验、响应式视觉统一、错误/空/加载状态、无障碍与性能优化。
- 待实现：竞赛、排行榜、举报审核、通知中心和端到端浏览器测试。
- 不在 v1 范围：付费、订阅和商业计费。

需求通过 GitHub Issues 管理，改动使用 `codex/*` 分支和 Draft PR。发布遵循平台 SemVer 与跨仓库发版日志。
