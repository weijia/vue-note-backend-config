/**
 * Provider config contracts shared between <BackendConfig> and its host app.
 * The component only reads/writes these plain objects — it never instantiates
 * any database, performs network I/O, or persists anything itself.
 */

export interface GitConfig {
  repoUrl: string
  branch?: string
  token?: string
  localPath?: string
}

export interface WebDAVConfig {
  url: string
  username: string
  password: string
  rootPath?: string
}

/** Gitee backend (zen-fs-gitee). Mounts a Gitee repo as a filesystem via REST API. */
export interface GiteeConfig {
  repoUrl: string
  owner: string
  token: string
  branch?: string
}

export type ProviderConfig = {
  git?: GitConfig
  webdav?: WebDAVConfig
  gitee?: GiteeConfig
}

/** Active backend selection. `null` means the built-in PouchDB-local provider. */
export type BackendType = 'git' | 'webdav' | 'gitee' | null
