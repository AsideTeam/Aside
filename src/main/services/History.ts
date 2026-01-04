/**
 * History Service
 *
 * 책임: 방문 기록 저장/조회 (DB 호출)
 * - 웹사이트 방문 기록 저장
 * - 방문 기록 조회/검색
 * - 오래된 기록 정리
 *
 * 사용 예:
 *   import { HistoryService } from '@main/services/History'
 *   await HistoryService.addHistory('https://example.com', 'Example')
 *   const list = await HistoryService.getHistory(100)
 */

import { logger } from '@main/utils/logger'

/**
 * 방문 기록 데이터 모델
 */
export interface HistoryEntry {
  id: string
  url: string
  title: string
  timestamp: Date
  visitCount: number
}

/**
 * History Service 싱글톤
 */
export class HistoryService {
  /**
   * 방문 기록 추가
   *
   * @param url - 방문한 URL
   * @param title - 페이지 제목
   * @returns 저장된 기록
   */
  static async addHistory(url: string, title: string): Promise<HistoryEntry> {
    try {
      logger.info('[HistoryService] Adding history', { url, title })

      // TODO: Prisma 연결 후 구현
      // const history = await Database.history.create({
      //   data: { url, title, timestamp: new Date() }
      // })

      const history: HistoryEntry = {
        id: `hist-${Date.now()}`,
        url,
        title,
        timestamp: new Date(),
        visitCount: 1,
      }

      logger.info('[HistoryService] History added', { id: history.id })
      return history
    } catch (error) {
      logger.error('[HistoryService] Add history failed:', error)
      throw error
    }
  }

  /**
   * 방문 기록 조회
   *
   * @param limit - 반환할 최대 기록 수
   * @returns 방문 기록 리스트
   */
  static async getHistory(limit: number = 50): Promise<HistoryEntry[]> {
    try {
      logger.info('[HistoryService] Getting history', { limit })

      // TODO: Prisma 연결 후 구현
      // const history = await Database.history.findMany({
      //   take: limit,
      //   orderBy: { timestamp: 'desc' }
      // })

      const history: HistoryEntry[] = []

      logger.info('[HistoryService] History retrieved', { count: history.length })
      return history
    } catch (error) {
      logger.error('[HistoryService] Get history failed:', error)
      throw error
    }
  }

  /**
   * 방문 기록 검색
   *
   * @param query - 검색 쿼리
   * @returns 검색 결과
   */
  static async searchHistory(query: string): Promise<HistoryEntry[]> {
    try {
      logger.info('[HistoryService] Searching history', { query })

      // TODO: Prisma 연결 후 구현
      const results: HistoryEntry[] = []

      logger.info('[HistoryService] History search completed', { count: results.length })
      return results
    } catch (error) {
      logger.error('[HistoryService] Search history failed:', error)
      throw error
    }
  }

  /**
   * 방문 기록 삭제
   *
   * @param id - 삭제할 기록 ID
   */
  static async deleteHistory(id: string): Promise<void> {
    try {
      logger.info('[HistoryService] Deleting history', { id })

      // TODO: Prisma 연결 후 구현

      logger.info('[HistoryService] History deleted', { id })
    } catch (error) {
      logger.error('[HistoryService] Delete history failed:', error)
      throw error
    }
  }

  /**
   * 모든 방문 기록 삭제
   */
  static async clearHistory(): Promise<void> {
    try {
      logger.info('[HistoryService] Clearing all history')

      // TODO: Prisma 연결 후 구현

      logger.info('[HistoryService] All history cleared')
    } catch (error) {
      logger.error('[HistoryService] Clear history failed:', error)
      throw error
    }
  }
}
