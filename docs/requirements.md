# 需求文档 — vue-note-backend-config

> 版本：0.1.0 ｜ 组件：`<BackendConfig>` ｜ 目标：为笔记类应用提供一个纯前端的“后端配置”模态组件。

## 1. 背景与目标

笔记应用需要支持多种后端（本地 PouchDB、Git、WebDAV），但配置的**录入与校验**应当和**实际连接/存储逻辑**解耦。本组件只负责：

1. 以弹窗形式收集用户输入；
2. 做前端必填与 URL 合法性校验；
3. 把结构化结果交给父组件。

组件本身**不联网、不建库、不持久化**。

## 2. 功能需求

### 2.1 组件形态
- Vue 3 `defineComponent` + TypeScript，单文件 `.vue`。
- 导出：ESM `default` + `named`（`BackendConfig`），并提供类型声明。

### 2.2 接口契约
```ts
interface GitConfig {
  repoUrl: string
  branch?: string
  token?: string
  localPath?: string
}
interface WebDAVConfig {
  url: string
  username: string
  password: string
  rootPath?: string
}
type ProviderConfig = { git?: GitConfig; webdav?: WebDAVConfig }
```

### 2.3 Props
- `open: boolean`（必填）— 控制弹窗显示/隐藏。
- `backendType: 'git' | 'webdav' | null`（必填）— 当前选中后端类型；`null` = PouchDB 本地。

### 2.4 Emits
- `update:open(value: boolean)`
- `update:backendType(value: BackendType)` — tabs 切换时同步（仅影响表单显示，不触发保存）。
- `save(config: ProviderConfig)`

### 2.5 UI 结构
1. 模态弹窗：遮罩层（点击关闭）+ 居中卡片（标题“配置后端”+ 关闭按钮 ×）。
2. 后端类型 tabs：PouchDB 本地 / Git / WebDAV，选中高亮；PouchDB 显示说明文字“本地存储，无需配置”，无表单。
3. Git 表单：`repoUrl`（必填）、`branch`（默认 `main`）、`token`（可选）、`localPath`（默认 `notes`）。
4. WebDAV 表单：`url`（必填）、`username`（必填）、`password`（必填）、`rootPath`（默认 `/`）。
5. 底部：取消（关闭）、保存（校验通过后构造 `ProviderConfig` 并 `emit('save')` + 关闭）。

### 2.6 校验规则
- Git：`repoUrl` 非空且为合法 URL。
- WebDAV：`url`/`username`/`password` 非空，`url` 为合法 URL。
- 校验失败时保存按钮 `disabled`，对应字段下方显示红色错误文字。

### 2.7 行为
- `open` 变 `true`：表单重置为“上次保存的值或默认值”。
- `open` 变 `false`：重置表单状态。
- 不写 `localStorage`，不发送任何网络请求。

## 3. 非功能需求

### 3.1 样式
- 遮罩：`position fixed; inset 0; background rgba(0,0,0,0.5); z-index 200`。
- 卡片：`fixed; top/left 50%; translate(-50%,-50%); white bg; padding 24px; radius 8px; z-index 201; max-height 90vh; overflow-y auto`。
- 字段：`label`(14px) + `input`(高 36px, border 1px #ddd, radius 4px, padding 0 8px)。
- 错误文字：12px, `#f44336`, margin-top 4px。
- 按钮：取消（文字按钮）+ 保存（实心蓝底白字），高 36px, radius 4px, padding 0 16px。
- 移动端：卡片宽 95%, padding 16px。

### 3.2 构建与分发
- 使用 Vite 库模式输出 ESM（`.mjs`）+ `.d.ts`。
- `package.json` 的 `exports` 必须包含：
  - `"./BackendConfig": "./dist/BackendConfig.mjs"`
  - `"./style.css": "./dist/style.css"`

### 3.3 可被网页直接调用
- 发布的 npm 包产物应能在**无打包工具**的普通 HTML 页面中通过 CDN（import map + ESM）直接使用。

## 4. 明确不做的范围
- 不测试网络连接；不创建/管理数据库实例；不持久化配置；不调用 Git / WebDAV API。

## 5. 验收标准
1. `npm run build` 产出 `dist/index.mjs`、`dist/BackendConfig.mjs`、`dist/style.css`、`dist/index.d.ts`。
2. Git/WebDAV 必填项为空或 URL 非法时保存按钮置灰且显示红色错误。
3. `save` 事件载荷符合 `ProviderConfig` 结构，且只含当前选中后端。
4. `examples/cdn.html` 在浏览器中可直接打开并使用组件（无需本地打包）。

## 6. 交付物
- 源代码（`src/`）、构建配置（Vite/TS）。
- 设计文档 `docs/design.md`。
- GitHub 仓库 + 自动发布 workflow（npm + GitHub Pages 示例）。
