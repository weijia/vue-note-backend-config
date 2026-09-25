<template>
  <div v-show="open" class="bc-overlay" @click.self="close">
    <div class="bc-card" role="dialog" aria-modal="true" aria-label="配置后端">
      <header class="bc-header">
        <h2 class="bc-title">配置后端</h2>
        <button class="bc-close" type="button" aria-label="关闭" @click="close">×</button>
      </header>

      <div class="bc-tabs">
        <button
          v-for="t in tabs"
          :key="String(t.key)"
          type="button"
          class="bc-tab"
          :class="{ 'bc-tab-active': activeTab === t.key }"
          @click="selectTab(t.key)"
        >
          {{ t.label }}
        </button>
      </div>

      <!-- PouchDB local: nothing to configure -->
      <div v-if="activeTab === null" class="bc-field">
        <p class="bc-hint">本地存储，无需配置</p>
      </div>

      <!-- Git -->
      <div v-else-if="activeTab === 'git'" class="bc-form">
        <div class="bc-field">
          <label class="bc-label" for="bc-git-repo">仓库地址 (repoUrl)</label>
          <input
            id="bc-git-repo"
            class="bc-input"
            type="text"
            v-model="gitForm.repoUrl"
            placeholder="https://github.com/user/repo.git"
            autocomplete="off"
          />
          <p v-if="gitErrors.repoUrl" class="bc-error">{{ gitErrors.repoUrl }}</p>
        </div>
        <div class="bc-field">
          <label class="bc-label" for="bc-git-branch">分支 (branch)</label>
          <input
            id="bc-git-branch"
            class="bc-input"
            type="text"
            v-model="gitForm.branch"
            placeholder="main"
            autocomplete="off"
          />
        </div>
        <div class="bc-field">
          <label class="bc-label" for="bc-git-token">Token</label>
          <input
            id="bc-git-token"
            class="bc-input"
            type="password"
            v-model="gitForm.token"
            placeholder="Personal Access Token"
            autocomplete="off"
          />
        </div>
        <div class="bc-field">
          <label class="bc-label" for="bc-git-path">本地存储路径 (localPath)</label>
          <input
            id="bc-git-path"
            class="bc-input"
            type="text"
            v-model="gitForm.localPath"
            placeholder="notes"
            autocomplete="off"
          />
        </div>
      </div>

      <!-- WebDAV -->
      <div v-else-if="activeTab === 'webdav'" class="bc-form">
        <div class="bc-field">
          <label class="bc-label" for="bc-wd-url">URL</label>
          <input
            id="bc-wd-url"
            class="bc-input"
            type="text"
            v-model="webdavForm.url"
            placeholder="https://dav.example.com"
            autocomplete="off"
          />
          <p v-if="webdavErrors.url" class="bc-error">{{ webdavErrors.url }}</p>
        </div>
        <div class="bc-field">
          <label class="bc-label" for="bc-wd-user">用户名 (username)</label>
          <input
            id="bc-wd-user"
            class="bc-input"
            type="text"
            v-model="webdavForm.username"
            placeholder="用户名"
            autocomplete="off"
          />
          <p v-if="webdavErrors.username" class="bc-error">{{ webdavErrors.username }}</p>
        </div>
        <div class="bc-field">
          <label class="bc-label" for="bc-wd-pass">密码 (password)</label>
          <input
            id="bc-wd-pass"
            class="bc-input"
            type="password"
            v-model="webdavForm.password"
            placeholder="密码"
            autocomplete="off"
          />
          <p v-if="webdavErrors.password" class="bc-error">{{ webdavErrors.password }}</p>
        </div>
        <div class="bc-field">
          <label class="bc-label" for="bc-wd-root">根路径 (rootPath)</label>
          <input
            id="bc-wd-root"
            class="bc-input"
            type="text"
            v-model="webdavForm.rootPath"
            placeholder="/notes"
            autocomplete="off"
          />
        </div>
      </div>

      <footer class="bc-footer">
        <button class="bc-btn bc-btn-text" type="button" @click="close">取消</button>
        <button
          class="bc-btn bc-btn-primary"
          type="button"
          :disabled="!isValid"
          @click="onSave"
        >
          保存
        </button>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, watch } from 'vue'
import type { BackendType, GitConfig, WebDAVConfig, ProviderConfig } from './types'
import { logConfig } from './debug'

const props = defineProps<{
  /** Controls dialog visibility. */
  open: boolean
  /** Currently selected backend type. */
  backendType: BackendType
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'update:backendType', value: BackendType): void
  (e: 'save', config: ProviderConfig): void
}>()

const tabs: { key: BackendType; label: string }[] = [
  { key: null, label: 'PouchDB 本地' },
  { key: 'git', label: 'Git' },
  { key: 'webdav', label: 'WebDAV' },
]

const activeTab = ref<BackendType>(props.backendType)

const defaultGit = (): GitConfig => ({ repoUrl: '', branch: 'main', token: '', localPath: 'notes' })
const defaultWebdav = (): WebDAVConfig => ({ url: '', username: '', password: '', rootPath: '/' })

const gitForm = reactive<GitConfig>(defaultGit())
const webdavForm = reactive<WebDAVConfig>(defaultWebdav())

/** Remembered last saved config so reopening restores it; not persisted anywhere. */
let savedProvider: ProviderConfig | null = null

function resetToDefaults() {
  Object.assign(gitForm, defaultGit())
  Object.assign(webdavForm, defaultWebdav())
  activeTab.value = props.backendType ?? null
  logConfig.log('resetToDefaults', { activeTab: activeTab.value })
}

function loadFromSaved() {
  if (savedProvider?.git) {
    Object.assign(gitForm, defaultGit(), savedProvider.git)
    activeTab.value = 'git'
    logConfig.log('loadFromSaved 恢复 git 配置（不含 token）', savedProvider.git.repoUrl)
  } else if (savedProvider?.webdav) {
    Object.assign(webdavForm, defaultWebdav(), savedProvider.webdav)
    activeTab.value = 'webdav'
    logConfig.log('loadFromSaved 恢复 webdav 配置（不含密码）', savedProvider.webdav.url)
  } else {
    logConfig.log('loadFromSaved 无历史配置，回落默认值')
    resetToDefaults()
  }
}

function isValidUrl(v: string): boolean {
  try {
    const u = new URL(v)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

const gitErrors = computed<Record<string, string>>(() => {
  const e: Record<string, string> = {}
  const repo = gitForm.repoUrl.trim()
  if (!repo) e.repoUrl = '仓库地址为必填项'
  else if (!isValidUrl(repo)) e.repoUrl = '请输入合法的 URL（需包含 http/https）'
  return e
})

const webdavErrors = computed<Record<string, string>>(() => {
  const e: Record<string, string> = {}
  const url = webdavForm.url.trim()
  if (!url) e.url = 'URL 为必填项'
  else if (!isValidUrl(url)) e.url = '请输入合法的 URL（需包含 http/https）'
  if (!webdavForm.username.trim()) e.username = '用户名为必填项'
  if (!webdavForm.password.trim()) e.password = '密码为必填项'
  return e
})

const isValid = computed<boolean>(() => {
  if (activeTab.value === 'git') return Object.keys(gitErrors.value).length === 0
  if (activeTab.value === 'webdav') return Object.keys(webdavErrors.value).length === 0
  return true
})

function selectTab(tab: BackendType) {
  logConfig.log('emit update:backendType', tab)
  activeTab.value = tab
  emit('update:backendType', tab)
}

function close() {
  logConfig.log('emit update:open', false)
  emit('update:open', false)
}

function onSave() {
  if (!isValid.value) {
    logConfig.warn('onSave SKIP 校验未通过', {
      activeTab: activeTab.value,
      gitErrors: gitErrors.value,
      webdavErrors: webdavErrors.value,
    })
    return
  }
  let config: ProviderConfig = {}
  if (activeTab.value === 'git') {
    const git: GitConfig = {
      repoUrl: gitForm.repoUrl.trim(),
      branch: (gitForm.branch ?? '').trim() || 'main',
      token: (gitForm.token ?? '').trim() || undefined,
      localPath: (gitForm.localPath ?? '').trim() || 'notes',
    }
    config = { git }
  } else if (activeTab.value === 'webdav') {
    const webdav: WebDAVConfig = {
      url: webdavForm.url.trim(),
      username: webdavForm.username.trim(),
      password: webdavForm.password,
      rootPath: (webdavForm.rootPath ?? '').trim() || '/',
    }
    config = { webdav }
  }
  savedProvider = config
  // 注意：config 内含 token / 密码，日志只输出脱敏后的结构信息
  logConfig.log('emit save', {
    tab: activeTab.value,
    git: config.git ? { repoUrl: config.git.repoUrl, branch: config.git.branch } : undefined,
    webdav: config.webdav ? { url: config.webdav.url, username: config.webdav.username } : undefined,
  })
  emit('save', config)
  emit('update:open', false)
}

watch(
  () => props.backendType,
  (val) => {
    logConfig.log('backendType prop 变化', val)
    if (props.open) activeTab.value = val
  },
)

watch(
  () => props.open,
  (open) => {
    logConfig.log('open prop 变化', open)
    if (open) loadFromSaved()
    // On close we intentionally keep the field values in memory; they are
    // restored/reset when the dialog reopens. No external state is touched.
  },
  { immediate: true },
)
</script>

<style scoped>
.bc-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 200;
}

.bc-card {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #fff;
  padding: 24px;
  border-radius: 8px;
  z-index: 201;
  width: 90%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
  box-sizing: border-box;
}

.bc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.bc-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #222;
}

.bc-close {
  border: none;
  background: transparent;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  color: #666;
  padding: 0;
}

.bc-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.bc-tab {
  flex: 1;
  height: 36px;
  border: 1px solid #ddd;
  background: #fff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
}

.bc-tab-active {
  border-color: #3b82f6;
  color: #3b82f6;
  background: #eef4ff;
}

.bc-form {
  display: block;
}

.bc-field {
  display: flex;
  flex-direction: column;
  margin-bottom: 12px;
}

.bc-label {
  font-size: 14px;
  margin-bottom: 6px;
  color: #333;
}

.bc-input {
  height: 36px;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 0 8px;
  font-size: 14px;
  box-sizing: border-box;
  width: 100%;
  outline: none;
}

.bc-input:focus {
  border-color: #3b82f6;
}

.bc-error {
  font-size: 12px;
  color: #f44336;
  margin-top: 4px;
  margin-bottom: 0;
}

.bc-hint {
  font-size: 14px;
  color: #888;
  margin: 8px 0;
}

.bc-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
}

.bc-btn {
  height: 36px;
  border-radius: 4px;
  padding: 0 16px;
  font-size: 14px;
  cursor: pointer;
  border: none;
}

.bc-btn-text {
  background: transparent;
  color: #666;
}

.bc-btn-primary {
  background: #3b82f6;
  color: #fff;
}

.bc-btn-primary:disabled {
  background: #9dc0f7;
  cursor: not-allowed;
}

@media (max-width: 600px) {
  .bc-card {
    width: 95%;
    padding: 16px;
  }
}
</style>
