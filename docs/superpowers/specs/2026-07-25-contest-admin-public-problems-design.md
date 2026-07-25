# 管理员比赛工作流与匿名题库设计

## 目标

在不伪造后端能力的前提下补齐两个 v1 产品缺口：

1. 管理员可通过真实 API 创建比赛、按 ID 打开比赛、编辑草稿、选择已发布不可变题目版本、保存编排、发布或取消比赛。
2. 匿名用户可浏览已发布题目列表与详情；提交、发布题解和发起讨论时才要求登录，登录后恢复提交前的代码与语言。

## 后端契约与明确缺口

当前 backend release 提供：

- `POST /api/v1/admin/contests`
- `PUT|DELETE /api/v1/admin/contests/{contestId}`
- `PUT /api/v1/admin/contests/{contestId}/problems`
- `POST /api/v1/admin/contests/{contestId}/publish`
- 管理员可通过 `GET /api/v1/contests/{contestId}` 与 `/problems` 读取草稿或私有比赛
- `GET /api/v1/admin/problems/{problemId}/versions` 可发现题目版本
- 匿名可调用 `POST /api/problem/list`、`GET /api/problem/{id}` 和 `GET /api/problem/no/{problemNo}`；服务端只返回已发布公开快照

当前不提供：

- 管理员比赛列表/生命周期筛选接口
- 独立题目顺序字段（服务端按 label 排序）
- 比赛更新 ETag 或版本前置条件
- open、close、archive 生命周期接口

因此管理员页面不使用 localStorage 或前端 fixture 伪造列表、顺序或状态。页面明确说明能力边界，以“创建 / 按 ID 打开”作为真实入口，只展示后端实际允许的 `DRAFT -> PUBLISHED`、`DRAFT|PUBLISHED -> CANCELLED` 操作。API 适配层独立，后续 backend #34 增加 list/ETag/order/lifecycle 后无需重写页面状态模型。

## 管理员比赛工作台

新增 `/admin/contests` 路由、侧栏入口与 `adminContestApi`。单页工作台包含：

- 比赛 ID 打开区和新建按钮
- 标题、Markdown 描述、ACM/OI、PUBLIC/PRIVATE 与五个时间字段
- 明确的时间顺序本地校验
- 题目 ID 输入，通过真实题目详情与版本发现 API，只允许选择 `PUBLISHED` 版本
- label 和 score 编辑、重复题目/label 校验
- 草稿保存、题目编排保存、发布确认和取消确认
- mutation 锁、错误状态、HTTP 409 冲突提示及显式重新加载

加载比赛使用请求序号与 AbortSignal，旧 ID 响应不能覆盖新选择。所有关键交互提供稳定 `data-testid`，布局在窄屏变为单列。

## 匿名题库与登录门禁

题库列表和普通题目详情路由标记为公开。公开题目 API 请求优先携带现有 token，以保留用户状态；若 token 过期返回 401，则只对显式 `anonymousFallback` 请求清理本地 session、移除 Authorization 并重试一次，不弹出登录框，也不把公开页面变为空白。

匿名用户可打开提交 tab 和编辑代码。点击提交时：

1. 以普通题目 ID（或 contestId + problemId）为作用域，将 code/language 写入 sessionStorage。
2. 跳转登录页并携带当前完整 URL 作为 redirect。
3. 登录成功回跳后，CodeEditor 从同一作用域恢复 code/language。
4. 后端接受提交后删除草稿；登录失败或页面刷新不会删除草稿。

sessionStorage 只保存当前浏览器会话中的源代码，不使用 localStorage。题解/讨论继续匿名可读，但创建按钮对匿名用户只触发同一登录 redirect，不调用写 API。普通提交历史对匿名用户显示登录提示，不发起私有查询。

## 测试

- API 契约测试：管理员比赛 method/path/body/signal；匿名 fallback 仅重试一次且移除 token。
- 路由测试：题库列表/详情公开、比赛后台仍受 admin 守卫。
- 纯函数测试：时间、重复题目/label、DTO、sessionStorage 草稿。
- 组件测试：创建、按 ID 打开、已发布版本选择、编排、发布/取消确认、409、陈旧响应；匿名提交保存草稿并跳转，登录后恢复，成功提交清理；题解/讨论匿名创建门禁。
- 全量运行 lint、Vitest、production build、audit、Docker 合同、actionlint 和 diff-check。
