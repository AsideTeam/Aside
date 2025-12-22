/**
 * Database Client (Prisma)
 *
 * 책임: Prisma Client 인스턴스 관리 및 연결 생명주기
 * - 싱글톤으로 인스턴스 제공
 * - 연결/종료 관리
 * - 재시도 로직 (선택사항)
 *
 * 사용 예 (main/services/history.ts):
 *   import { Database } from '@main/database/client';
 *   const client = Database.getClient();
 *   const histories = await client.history.findMany();
 *
 * 참고:
 * - Prisma는 자동으로 연결 풀링 관리
 * - 앱 종료 시 반드시 disconnect() 호출 필요
 */

import { PrismaClient } from '@prisma/client'
import { logger } from '@main/utils/Logger'

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
   * 데이터베이스 연결 (앱 부팅 단계)
   *
   * @param dbPath SQLite 파일 경로 (예: /home/user/.config/Aside/app.db)
   */
  static async connect(dbPath: string): Promise<void> {
    if (this.isConnected) {
      logger.warn('Database already connected')
      return
    }

    try {
      logger.info('Connecting to database...', { dbPath })

      // Prisma Client 인스턴스 생성 (DATABASE_URL 환경변수 사용)
      process.env.DATABASE_URL = `file:${dbPath}`
      const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL })
      this.client = new PrismaClient({ adapter })

      // 연결 테스트 (간단한 쿼리 실행)
      await this.client.$queryRaw`SELECT 1`

      this.isConnected = true
      logger.info('Database connected successfully', { dbPath })
    } catch (error) {
      logger.error('Failed to connect to database', error, { dbPath })
      throw error
    }
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
