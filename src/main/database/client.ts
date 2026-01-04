/**
 * Database Client (Prisma)
 *
 * 책임: Prisma Client 인스턴스 관리
 * - 싱글톤으로 인스턴스 제공
 * - 연결/종료 관리
 *
 * 사용:
 *   import { Database } from '@main/database/client';
 *   const client = Database.getClient();
 *
 * 참고: 
 * - 연결은 connection.ts의 connectWithRetry() 사용
 * - 앱 종료 시 disconnect() 호출 필요
 */

import { PrismaClient } from '@prisma/client'
import { logger } from '@main/utils/logger'

/**
 * Database 싱글톤 관리
 */
export class Database {
  private static client: PrismaClient | null = null
  private static isConnected = false

  /**
   * Prisma Client 인스턴스 반환 (이미 연결되어 있다고 가정)
   *
   * @throws Error if not connected
   */
  static getClient(): PrismaClient {
    if (!this.client) {
      throw new Error('[Database] Client not initialized. Call Database.connect() first.')
    }
    return this.client
  }



  /**
   * 데이터베이스 연결 종료 (앱 종료 단계)
   */
  static async disconnect(): Promise<void> {
    if (!this.client) {
      logger.warn('Database client not initialized')
      return
    }

    try {
      logger.info('Disconnecting from database...')
      await this.client.$disconnect()
      this.isConnected = false
      this.client = null
      logger.info('Database disconnected successfully')
    } catch (error) {
      logger.error('Failed to disconnect database', error)
      throw error
    }
  }

  /**
   * 연결 상태 확인
   */
  static isReady(): boolean {
    return this.isConnected && this.client !== null
  }

  /**
   * 싱글톤 검증 (인스턴스화 방지)
   */
  private constructor() {
    throw new Error('Database is a singleton. Use Database.getClient() instead.')
  }
}
