# vue-note-backend-config

一个 Vue 3 `<BackendConfig>` 模态组件，用于为笔记类应用配置后端存储：**PouchDB 本地 / Git / WebDAV**。

组件自身**不发起任何网络请求、不创建/管理数据库实例、不持久化任何配置**——它只收集用户输入并校验，然后把结构化的 `ProviderConfig` 通过 `save` 事件抛给父组件。

- 技术栈：Vue 3 `defineComponent` + `<script setup lang="ts">`，单文件组件 `.vue`
- 构建：Vite 库模式，输出 ESM（`.mjs`）+ 类型声明（`.d.ts`）
- 产物可直接被打包工具 `import`，也可通过 CDN 在普通网页中**直接调用**

---

## 安装

```bash
npm install vue-note-backend-config vue
```

`vue` 为 peerDependency（需 `^3.3.0`）。

---

## 在打包工具中使用（ESM）

```ts
import { createApp, ref } from 'vue'
import BackendConfig from 'vue-note-backend-config'
import type { ProviderConfig, BackendType } from 'vue-note-backend-config'
import 'vue-note-backend-config/style.css'

const app = createApp({
  setup() {
    const open = ref(true)
    const type = ref<BackendType>(null)
    function onSave(cfg: ProviderConfig) {
      // 在这里把 cfg 交给你的持久层 / 连接管理器
      console.log('saved', cfg)
    }
    return { open, type, onSave }
  },
})
app.component('BackendConfig', BackendConfig)
app.mount('#app')
```

```html
<backend-config
  v-model:open="open"
  v-model:backend-type="type"
  @save="onSave"
/>
```

> 也可按需导入：
> ```ts
> import { BackendConfig } from 'vue-note-backend-config/BackendConfig'
> import 'vue-note-backend-config/style.css'
> ```

---

## 在网页中直接调用（无需打包工具）

`dist/BackendConfig.mjs` 与 `dist/style.css` 已发布到 npm，可通过 jsDelivr / unpkg 等 CDN 直接使用。完整示例见 [`examples/cdn.html`](./examples/cdn.html)。

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/vue-note-backend-config/dist/style.css" />

<script type="importmap">
{
  "imports": {
    "vue": "https://unpkg.com/vue@3/dist/vue.esm-browser.prod.js"
  }
}
</script>

<script type="module">
  import { createApp, ref } from 'vue'
  import { BackendConfig } from 'https://cdn.jsdelivr.net/npm/vue-note-backend-config/dist/BackendConfig.mjs'

  createApp({
    components: { BackendConfig },
    setup() {
      const open = ref(true)
      const type = ref(null)
      const onSave = (cfg) => console.log('saved', cfg)
      return { open, type, onSave }
    },
  }).mount('#app')
</script>
```

---

## Props

| 名称          | 类型                          | 必填 | 说明                         |
| ------------- | ----------------------------- | ---- | ---------------------------- |
| `open`        | `boolean`                     | 是   | 控制弹窗显示 / 隐藏          |
| `backendType` | `'git' \| 'webdav' \| null`   | 是   | 当前选中的后端类型（null = PouchDB 本地） |

## Emits

| 事件                  | 载荷                  | 说明                                                 |
| --------------------- | --------------------- | ---------------------------------------------------- |
| `update:open`         | `boolean`             | 遮罩/关闭按钮/取消时 `emit(false)`                   |
| `update:backendType`  | `BackendType`         | 切换 tabs 时同步当前选中类型（仅影响表单，不自动保存）|
| `save`                | `ProviderConfig`      | 校验通过后构造配置对象并抛出，同时 `emit('update:open', false)` |

## ProviderConfig 结构

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

`save` 时只会携带当前选中的那一种后端（PouchDB 本地则抛出空对象 `{}`）。

---

## 校验规则

- **Git**：`repoUrl` 非空且为合法 `http/https` URL
- **WebDAV**：`url`、`username`、`password` 非空，且 `url` 为合法 `http/https` URL
- 校验失败时**保存按钮置灰（disabled）**，并在对应字段下方显示红色错误文字

---

## 明确不做的（约束）

- 不测试网络连接
- 不创建 / 管理任何数据库实例
- 不持久化配置（由父组件决定存到 localStorage 或远端）
- 不调用 Git 或 WebDAV API

---

## 本地开发

```bash
npm install
npm run dev        # 打开演示页面（src/App.vue）
npm run build      # 构建 dist
npm run typecheck  # vue-tsc 类型检查
```

---

## 自动发布

- `.github/workflows/publish.yml`：push 到 `main` 时构建 + 类型检查并上传 `dist` 产物；打 **Release** 时自动 `npm publish`。
  - 需要在仓库 **Settings → Secrets → Actions** 中配置 `NPM_TOKEN`（npmjs 上的 Access Token）。
- `.github/workflows/pages.yml`：将 `examples/` 部署到 **GitHub Pages**，提供在线“网页直接调用”示例。

## License

[MIT](./LICENSE) © weijia
