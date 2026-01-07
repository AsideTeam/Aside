import { session } from 'electron'
import path from 'node:path'
import { promises as fs } from 'node:fs'
import type { Dirent } from 'node:fs'

import { logger } from '@main/utils/logger'
import { SettingsStore } from '@main/services/SettingsStore'

type LoadedExtension = {
  id: string
  name: string
  version: string
}

export class ExtensionsService {
  private static instance: ExtensionsService | null = null
  private loadedExtensionIds = new Set<string>()
  private store = SettingsStore.getInstance()

  static getInstance(): ExtensionsService {
    if (!this.instance) this.instance = new ExtensionsService()
    return this.instance
  }

  private constructor() {}

  async getStatus(): Promise<{
    enabled: boolean
    directory: string
    loaded: LoadedExtension[]
  }> {
    const enabled = this.store.get('extensionsEnabled')
    const directory = this.store.get('extensionsDirectory')

    const loaded = session.defaultSession
      .getAllExtensions()
      .filter((ext) => this.loadedExtensionIds.has(ext.id))
      .map((ext) => ({ id: ext.id, name: ext.name, version: ext.version }))

    return { enabled, directory, loaded }
  }

  async reload(): Promise<{ success: boolean; error?: string; loadedCount: number }> {
    try {
      await this.unloadAll()

      const enabled = this.store.get('extensionsEnabled')
      const directory = this.store.get('extensionsDirectory')

      if (!enabled) {
        logger.info('[ExtensionsService] Extensions disabled; nothing to load')
        return { success: true, loadedCount: 0 }
      }

      if (!directory) {
        logger.info('[ExtensionsService] No extensions directory set')
        return { success: true, loadedCount: 0 }
      }

      const loadedCount = await this.loadAllFromDirectory(directory)
      return { success: true, loadedCount }
    } catch (error) {
      logger.error('[ExtensionsService] Reload failed', error)
      return { success: false, error: String(error), loadedCount: 0 }
    }
  }

  private async unloadAll(): Promise<void> {
    const ids = Array.from(this.loadedExtensionIds)
    this.loadedExtensionIds.clear()

    for (const id of ids) {
      try {
        session.defaultSession.removeExtension(id)
        logger.info('[ExtensionsService] Extension removed', { id })
      } catch (error) {
        logger.warn('[ExtensionsService] Failed to remove extension', { id, error: String(error) })
      }
    }
  }

  private async loadAllFromDirectory(directory: string): Promise<number> {
    let entries: Array<Dirent>
    try {
      entries = await fs.readdir(directory, { withFileTypes: true })
    } catch (error) {
      logger.warn('[ExtensionsService] Cannot read extensions directory', { directory, error: String(error) })
      return 0
    }

    const candidates = entries.filter((e) => e.isDirectory()).map((e) => path.join(directory, e.name))
    let loadedCount = 0

    for (const extensionPath of candidates) {
      const manifestPath = path.join(extensionPath, 'manifest.json')
      try {
        await fs.access(manifestPath)
      } catch {
        continue
      }

      try {
        const ext = await session.defaultSession.loadExtension(extensionPath, {
          allowFileAccess: true,
        })
        this.loadedExtensionIds.add(ext.id)
        loadedCount += 1
        logger.info('[ExtensionsService] Extension loaded', {
          id: ext.id,
          name: ext.name,
          version: ext.version,
        })
      } catch (error) {
        logger.warn('[ExtensionsService] Failed to load extension', {
          extensionPath,
          error: String(error),
        })
      }
    }

    return loadedCount
  }
}
