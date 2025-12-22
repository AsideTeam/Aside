/**
 * File System Helper
 *
 * 책임: Main 프로세스에서 안전한 파일 시스템 조작
 * - 폴더 생성/삭제
 * - 파일 읽기/쓰기
 * - 경로 검증
 *
 * 사용 예:
 *   import { FsHelper } from '@main/utils/FsHelper'
 *   await FsHelper.ensureDir('/path/to/dir')
 *   const content = await FsHelper.readFile('/path/to/file.txt')
 */

import { promises as fs } from 'node:fs'
import { dirname } from 'node:path'
import { logger } from './Logger'

/**
 * File System 헬퍼 싱글톤
 */
export class FsHelper {
  /**
   * 디렉토리 생성 (없으면 생성, 있으면 무시)
   *
   * @param dirPath - 생성할 디렉토리 경로
   */
  static async ensureDir(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true })
      logger.debug('[FsHelper] Directory ensured', { path: dirPath })
    } catch (error) {
      logger.error('[FsHelper] ensureDir failed:', error)
      throw error
    }
  }

  /**
   * 파일 읽기
   *
   * @param filePath - 읽을 파일 경로
   * @returns 파일 내용
   */
  static async readFile(filePath: string): Promise<string> {
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      logger.debug('[FsHelper] File read', { path: filePath })
      return content
    } catch (error) {
      logger.error('[FsHelper] readFile failed:', error)
      throw error
    }
  }

  /**
   * 파일 쓰기
   *
   * @param filePath - 쓸 파일 경로
   * @param content - 파일 내용
   */
  static async writeFile(filePath: string, content: string): Promise<void> {
    try {
      // 부모 디렉토리 생성
      await this.ensureDir(dirname(filePath))

      await fs.writeFile(filePath, content, 'utf-8')
      logger.debug('[FsHelper] File written', { path: filePath })
    } catch (error) {
      logger.error('[FsHelper] writeFile failed:', error)
      throw error
    }
  }

  /**
   * 파일 삭제
   *
   * @param filePath - 삭제할 파일 경로
   */
  static async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath)
      logger.debug('[FsHelper] File deleted', { path: filePath })
    } catch (error) {
      logger.error('[FsHelper] deleteFile failed:', error)
      throw error
    }
  }

  /**
   * 경로 존재 여부 확인
   *
   * @param path - 확인할 경로
   * @returns 존재하면 true
   */
  static async pathExists(path: string): Promise<boolean> {
    try {
      await fs.access(path)
      return true
    } catch {
      return false
    }
  }

  /**
   * 디렉토리 내용 읽기
   *
   * @param dirPath - 읽을 디렉토리 경로
   * @returns 파일/폴더 이름 배열
   */
  static async readDir(dirPath: string): Promise<string[]> {
    try {
      const entries = await fs.readdir(dirPath)
      logger.debug('[FsHelper] Directory read', { path: dirPath, count: entries.length })
      return entries
    } catch (error) {
      logger.error('[FsHelper] readDir failed:', error)
      throw error
    }
  }
}
