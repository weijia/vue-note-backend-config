import BackendConfig from './BackendConfig.vue'

export { BackendConfig }
export default BackendConfig
export * from './types'

// 调试开关 API（详见 ./debug）
export {
  DEBUG_NAMESPACES,
  createDebugLogger,
  describeDebug,
  disableDebug,
  enableDebug,
  enabledDebugNamespaces,
  initDebug,
  isDebugOn,
  listDebug,
  matchesNamespace,
  setDebug,
  silenceDebug,
} from './debug'
export type { DebugNamespace } from './debug'
