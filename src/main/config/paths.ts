import { app } from 'electron'
import path from 'path'

/**
 * 환경 변수 및 경로 로드
 */
export class Config {
  static isDev = !app.isPackaged
  
  static getAppDataDir(): string {
    return app.getPath('userData')
  }

  static getDbPath(): string {
    const appData = this.getAppDataDir()
    return path.join(appData, 'aside.db')
  }

  static getDatabaseURL(): string {
    return `file:${this.getDbPath()}`
  }

  static getLogDir(): string {
    const appData = this.getAppDataDir()
    return path.join(appData, 'logs')
  }

  static getResourcesDir(): string {
    return app.isPackaged
      ? path.join(app.getAppPath(), 'resources')
      : path.join(process.cwd(), 'resources')
  }
}
