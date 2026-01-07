import { app, shell } from 'electron'
import path from 'node:path'

import { logger } from '@main/utils/logger'

type DefaultBrowserStatus = {
  http: boolean
  https: boolean
}

function getDevProtocolArgs(): { execPath: string; args: string[] } | null {
  if (app.isPackaged) return null
  const mainArg = process.argv[1]
  if (!mainArg) return null
  return { execPath: process.execPath, args: [path.resolve(mainArg)] }
}

export class DefaultBrowserService {
  private static instance: DefaultBrowserService | null = null

  static getInstance(): DefaultBrowserService {
    if (!this.instance) this.instance = new DefaultBrowserService()
    return this.instance
  }

  private constructor() {}

  getStatus(): DefaultBrowserStatus {
    const devArgs = getDevProtocolArgs()

    const http = devArgs
      ? app.isDefaultProtocolClient('http', devArgs.execPath, devArgs.args)
      : app.isDefaultProtocolClient('http')

    const https = devArgs
      ? app.isDefaultProtocolClient('https', devArgs.execPath, devArgs.args)
      : app.isDefaultProtocolClient('https')

    return { http, https }
  }

  setDefault(): { success: boolean; status: DefaultBrowserStatus; error?: string } {
    try {
      const devArgs = getDevProtocolArgs()

      const httpOk = devArgs
        ? app.setAsDefaultProtocolClient('http', devArgs.execPath, devArgs.args)
        : app.setAsDefaultProtocolClient('http')

      const httpsOk = devArgs
        ? app.setAsDefaultProtocolClient('https', devArgs.execPath, devArgs.args)
        : app.setAsDefaultProtocolClient('https')

      logger.info('[DefaultBrowserService] setDefault attempted', { httpOk, httpsOk })
      return { success: httpOk && httpsOk, status: this.getStatus() }
    } catch (error) {
      logger.error('[DefaultBrowserService] setDefault failed', error)
      return { success: false, error: String(error), status: this.getStatus() }
    }
  }

  async openSystemSettings(): Promise<{ success: boolean; error?: string }> {
    try {
      const url =
        process.platform === 'darwin'
          ? 'x-apple.systempreferences:com.apple.preference.general'
          : process.platform === 'win32'
            ? 'ms-settings:defaultapps'
            : null

      if (!url) {
        return { success: false, error: 'Unsupported platform' }
      }

      await shell.openExternal(url)
      return { success: true }
    } catch (error) {
      logger.error('[DefaultBrowserService] openSystemSettings failed', error)
      return { success: false, error: String(error) }
    }
  }
}
