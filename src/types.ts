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

export type ProviderConfig = {
  git?: GitConfig
  webdav?: WebDAVConfig
}

/** Active backend selection. `null` means the built-in PouchDB-local provider. */
export type BackendType = 'git' | 'webdav' | null
