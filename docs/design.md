# 设计文档 — vue-note-backend-config

## 1. 总体设计

组件采用**受控（controlled）**模式：可见性（`open`）与当前后端类型（`backendType`）均由父组件通过 `v-model` 驱动；用户输入仅在点击“保存”时通过 `save` 事件一次性上抛，组件内部不做任何副作用。

```
父组件 ──(v-model:open / v-model:backend-type)──► <BackendConfig>
   ▲                                                  │
   └───────────────(save: ProviderConfig)────────────┘
```

### 为什么是受控组件
- 弹窗的开/关、当前 tab 的状态完全由父组件状态决定，便于与路由、全局 store 联动。
- 组件不持有“已提交配置”的真相源，只维护“正在编辑的草稿”与“上次保存的快照”（内存态，不落盘），满足“不持久化”约束。

## 2. 目录结构

```
vue-note-backend-config/
├── src/
│   ├── types.ts            # GitConfig / WebDAVConfig / ProviderConfig / BackendType
│   ├── BackendConfig.vue   # 组件本体（模板 + 逻辑 + scoped 样式）
│   ├── BackendConfig.ts    # 入口：重新导出组件与类型（→ dist/BackendConfig.mjs）
│   ├── index.ts            # 包主入口（→ dist/index.mjs）
│   ├── App.vue             # 本地演示页
│   └── main.ts             # 演示入口
├── examples/
│   └── cdn.html            # 网页直接调用示例（import map + jsDelivr）
├── .github/workflows/
│   ├── publish.yml         # 构建 + 类型检查 + 发布 npm
│   └── pages.yml           # 部署 examples 到 GitHub Pages
├── index.html              # Vite 开发入口
├── vite.config.ts
├── tsconfig.json
├── package.json
├── README.md
├── LICENSE
└── docs/ (requirements.md / design.md)
```

## 3. 组件内部设计

### 3.1 状态
| 状态 | 类型 | 说明 |
| --- | --- | --- |
| `activeTab` | `BackendType` | 当前选中的 tab（来自 `backendType`，并随 tabs 点击更新） |
| `gitForm` | `GitConfig` | Git 表单草稿（reactive） |
| `webdavForm` | `WebDAVConfig` | WebDAV 表单草稿（reactive） |
| `savedProvider` | `ProviderConfig \| null` | 上次保存的快照（组件实例内存态，关闭/重开不丢失） |

### 3.2 关键逻辑
- **打开时重置**：`watch(open)` 在变为 `true` 时调用 `loadFromSaved()` —— 若存在 `savedProvider` 则回填对应后端表单并将 tab 切到该后端，否则 `resetToDefaults()`。
- **关闭时不落盘**：`open` 变为 `false` 仅触发 `emit('update:open', false)`；草稿保留在内存，下次打开再按快照/默认值重置，符合“不持久化”约束。
- **tabs 切换**：`selectTab()` 更新 `activeTab` 并 `emit('update:backendType')`，仅切换可见表单，不触发保存。
- **校验**：`isValidUrl()` 用 `new URL()` 包裹 try/catch 并限制 `http/https`；`gitErrors` / `webdavErrors` 为 `computed`，保存按钮 `:disabled="!isValid"`。
- **保存**：`onSave()` 在 `isValid` 为真时，按 `activeTab` 构造 `ProviderConfig`（仅含当前后端；PouchDB 为 `{}`），写入 `savedProvider`，`emit('save', config)` 并关闭。

### 3.3 校验失败反馈
- 保存按钮 `disabled`。
- 字段下方渲染对应 `bc-error` 红色文字（12px / `#f44336`）。

## 4. 样式方案
- 全部使用 `scoped` 样式，避免污染宿主页面。
- 遮罩 `z-index 200`、卡片 `z-index 201`；卡片 `position fixed + translate(-50%,-50%)` 居中。
- 移动端（`max-width: 600px`）卡片宽 95%、padding 16px。
- 因使用 Vite 库模式 + 外部 `vue`，CSS 被抽取为 `dist/style.css`，需由使用方显式引入（见 README）。

## 5. 构建与产物
- **工具**：Vite 5 + `@vitejs/plugin-vue` + `vite-plugin-dts`。
- **入口**：`index` → `index.mjs`；`BackendConfig` → `BackendConfig.mjs`。
- **格式**：ESM（`.mjs`）。
- **外部化**：`vue` 标记为 external（peerDependency），运行时由宿主/import map 提供。
- **类型**：`vite-plugin-dts` 生成 `dist/index.d.ts`（含全部类型）。
- **exports**：
  ```json
  {
    ".":                 { "types": "./dist/index.d.ts", "import": "./dist/index.mjs" },
    "./BackendConfig":   { "types": "./dist/index.d.ts", "import": "./dist/BackendConfig.mjs" },
    "./style.css":       "./dist/style.css"
  }
  ```

## 6. “网页直接调用”方案
- 发布的 `dist/BackendConfig.mjs`（ESM）与 `dist/style.css` 可通过 jsDelivr/unpkg 加载。
- 浏览器原生 `import map` 提供 `vue`，无需 webpack/vite。
- 示例 `examples/cdn.html`：引入样式 + import map + `<script type="module">` 直接 `import` 组件并 `createApp().mount()`。
- GitHub Pages 工作流把 `examples/` 部署为静态站，提供线上可运行样例。

## 7. CI / 发布流程
- **publish.yml**：
  - `push` 到 `main`：安装依赖 → `vue-tsc` 类型检查 → `vite build` → 上传 `dist` 产物（便于查看）。
  - 打 **Release**（`release: published`）：同样构建后执行 `npm publish --access public`，凭据来自仓库 Secret `NPM_TOKEN`。
- **pages.yml**：将 `examples/` 部署到 GitHub Pages。

### 需要的密钥
- `NPM_TOKEN`：在 npmjs 生成的 Automation/Publish Token，配置到仓库 `Settings → Secrets → Actions`。

## 8. 约束与边界
- 不测试网络连接、不创建/管理数据库、不持久化、不调用 Git/WebDAV API——这些均由父组件在收到 `save` 后自行处理。
- 组件仅做最小可用性校验（必填 + URL 合法性），更深入的连接可达性测试不在范围内。
