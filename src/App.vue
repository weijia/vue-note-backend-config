<template>
  <div class="demo">
    <h1>vue-note-backend-config 演示</h1>
    <button class="open-btn" type="button" @click="open = true">打开后端配置</button>

    <h3>当前已保存配置</h3>
    <pre>{{ pretty }}</pre>

    <BackendConfig
      v-model:open="open"
      v-model:backend-type="type"
      @save="onSave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import BackendConfig from './BackendConfig.vue'
import type { ProviderConfig, BackendType } from './types'
import { logDemo } from './debug'

const open = ref(false)
const type = ref<BackendType>(null)
const config = ref<ProviderConfig>({})

const pretty = computed(() => JSON.stringify(config.value, null, 2) || '（尚未保存）')

function onSave(c: ProviderConfig) {
  config.value = c
  // 完整配置已渲染在页面上；控制台只输出脱敏摘要，避免密码进日志
  const masked = {
    ...c,
    git: c.git ? { ...c.git, token: c.git.token ? '***' : undefined } : undefined,
    webdav: c.webdav ? { ...c.webdav, password: '***' } : undefined,
  }
  logDemo.log('save', masked)
}
</script>

<style scoped>
.demo {
  font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
  max-width: 640px;
  margin: 40px auto;
  padding: 0 16px;
  color: #222;
}
.open-btn {
  height: 36px;
  border: none;
  border-radius: 4px;
  padding: 0 16px;
  background: #3b82f6;
  color: #fff;
  cursor: pointer;
  font-size: 14px;
}
pre {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
  font-size: 13px;
}
</style>
