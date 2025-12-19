import path from 'path'
import { app } from 'electron'
import { isDev } from '@shared/constants/app'

/**
 * 환경 설정 (Config) - 싱글톤
 * 
 * 책임:
 * - 환경 변수 로드
 * - 경로 관리 (userData, logs, db 등)
 * - 디렉토리 존재 보장
 */

export class Config {
  private static instance: Config
  private _appDataDir: string = ''
  private _logsDir: string = ''
  private _dbPath: string = ''
  private _databaseUrl: string = ''

  private constructor() {}

  static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config()
    }
    return Config.instance
  }

  load(): void {
    // App Data Directory (사용자별 데이터)
    this._appDataDir = app.getPath('userData')

    // DB Path
    this._dbPath = path.join(this._appDataDir, 'aside.db')
    this._databaseUrl = `file:${this._dbPath}`

    // Logs Directory
    this._logsDir = path.join(this._appDataDir, 'logs')

    // 디렉토리 생성 (존재하지 않으면)
    this.ensureDirectories()
  }

  private ensureDirectories(): void {
    const fs = require('fs')
    const dirs = [this._appDataDir, this._logsDir]
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
    })
  }

  get appDataDir(): string {
    return this._appDataDir
  }

  get logsDir(): string {
    return this._logsDir
  }

  get dbPath(): string {
    return this._dbPath
  }

  get databaseUrl(): string {
    return this._databaseUrl
  }

  get isDev(): boolean {
    return isDev
  }

  get isProd(): boolean {
    return !isDev
  }
}
