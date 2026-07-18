# CodeRushOJ Frontend

CodeRushOJ 的 Vue 3 Web 应用，提供用户端和管理端界面。当前实现覆盖登录注册、邮箱验证、个人资料、题目列表与详情、Monaco 代码编辑器、提交查询，以及用户/题目/标签管理基础页面；竞赛、论坛和题解界面将在对应 Issue 中继续实现。

## 技术栈

- Vue 3 + Vite 5
- Vue Router + 路由权限守卫
- Pinia + 持久化状态
- Element Plus
- Monaco Editor（C++、Java、Python、JavaScript、Go）
- Vue I18n（中文/英文）
- Axios API client
- Sass 主题与组件样式

## 目录

```text
src/
├── api/          # 后端 API 模块与 Axios 拦截器
├── components/   # 验证码、语言选择、代码编辑器等复用组件
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
pnpm build
```

当前仓库尚未沉淀组件与端到端测试，这是 v1 前端迭代的明确缺口。新增功能必须同步添加 Vitest 组件测试或 Playwright 流程测试，CI 最终会强制执行 lint、测试和生产构建。

## 部署

生产构建输出位于 `dist/`：

```bash
pnpm build
pnpm preview --host 0.0.0.0
```

正式 Docker 镜像、Nginx 静态资源配置、Gateway 路由、Secret/ConfigMap 和 Kubernetes 部署由 [`croj-platform`](https://github.com/CodeRushOJ/croj-platform) 统一管理。完整系统安装请从平台仓库的快速开始进入。

## 功能状态

- 已有：认证、邮箱验证、题目浏览、代码编辑、基础提交、个人设置、管理端基础页面、主题和国际化。
- 迭代中：真实判题状态体验、响应式视觉统一、错误/空/加载状态、无障碍与性能优化。
- 待实现：竞赛、排行榜、论坛、评论、题解、举报审核和通知中心。
- 不在 v1 范围：付费、订阅和商业计费。

需求通过 GitHub Issues 管理，改动使用 `codex/*` 分支和 Draft PR。发布遵循平台 SemVer 与跨仓库发版日志。
