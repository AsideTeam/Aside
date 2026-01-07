import type { WebContents } from 'electron'
import { nativeTheme } from 'electron'

import { logger } from '@main/utils/logger'
import { SettingsStore } from '@main/services/SettingsStore'
import type { SettingsSchema } from '@shared/types'

type Theme = SettingsSchema['theme']

function toNativeThemeSource(theme: Theme): 'system' | 'light' | 'dark' {
  switch (theme) {
    case 'light':
      return 'light'
    case 'dark':
      return 'dark'
    case 'system':
    default:
      return 'system'
  }
}

async function withDebugger(webContents: WebContents, fn: () => Promise<void>): Promise<void> {
  if (webContents.isDestroyed()) return

  try {
    webContents.debugger.attach('1.3')
  } catch (error) {
    // In dev, opening DevTools can cause: "Another debugger is already attached".
    logger.warn('[AppearanceService] Failed to attach debugger (CDP emulation disabled for this webContents)', {
      id: webContents.id,
      error: String(error),
    })
    return
  }

  try {
    await fn()
  } catch (error) {
    // target closed / detached mid-flight 등은 탭 생명주기 경쟁으로 흔함
    logger.warn('[AppearanceService] CDP command failed', {
      id: webContents.id,
      error: String(error),
    })
  } finally {
    try {
      webContents.debugger.detach()
    } catch {
      // ignore
    }
  }
}

export class AppearanceService {
  private static initialized = false
  private static unsubscribers: Array<() => void> = []

  static initialize(): void {
    if (this.initialized) return
    this.initialized = true

    const store = SettingsStore.getInstance()

    // Apply immediately on boot.
    this.applyNativeTheme(store.get('theme'))

    // Keep nativeTheme in sync.
    this.unsubscribers.push(
      store.onChange('theme', (value) => {
        const theme = (value === 'light' || value === 'dark' || value === 'system') ? value : store.get('theme')
        this.applyNativeTheme(theme)
      })
    )
  }

  static applyNativeTheme(theme: Theme): void {
    try {
      nativeTheme.themeSource = toNativeThemeSource(theme)
      logger.info('[AppearanceService] Applied nativeTheme.themeSource', { themeSource: nativeTheme.themeSource })
    } catch (error) {
      logger.error('[AppearanceService] Failed to apply native theme', error)
    }
  }

  static async applyToWebContents(webContents: WebContents): Promise<void> {
    const store = SettingsStore.getInstance()
    const theme = store.get('theme')

    // Theme → prefers-color-scheme (CDP). Language는 session Accept-Language로 처리.
    await withDebugger(webContents, async () => {
      if (theme === 'system') {
        await webContents.debugger.sendCommand('Emulation.setEmulatedMedia', { media: '', features: [] })
        return
      }

      await webContents.debugger.sendCommand('Emulation.setEmulatedMedia', {
        media: '',
        features: [{ name: 'prefers-color-scheme', value: theme }],
      })
    })
  }

  static dispose(): void {
    for (const unsub of this.unsubscribers) {
      try {
        unsub()
      } catch {
        // ignore
      }
    }
    this.unsubscribers = []
    this.initialized = false
  }
}
