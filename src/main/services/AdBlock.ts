/**
 * AdBlock Service
 *
 * 책임: 광고 차단 필터링 로직
 * - 광고 URL 패턴 매칭
 * - 웹 요청 차단
 * - 필터 업데이트
 *
 * 사용 예:
 *   import { AdBlockService } from '@main/services/AdBlock'
 *   AdBlockService.initialize()
 *   AdBlockService.isAdURL('https://ads.example.com/banner.js')
 */

import { logger } from '@main/utils/Logger'

/**
 * AdBlock 싱글톤
 */
export class AdBlockService {
  private static adPatterns: RegExp[] = [
    // 공통 광고 네트워크
    /ad[svertizing]*\.google\./i,
    /ads\.g\.doubleclick\.net/i,
    /googlesyndication\.com/i,
    /adclick\./i,
    /ads\.facebook\.com/i,
    /ads\.linkedin\.com/i,
    /ads\.twitter\.com/i,
    /bat\.bing\.com/i,
    /pagead\d+\.googlesyndication\.com/i,
    /analytics\.google\.com/i,
  ]

  /**
   * AdBlock Service 초기화
   */
  static initialize(): void {
    logger.info('[AdBlockService] Initializing with', {
      patterns: this.adPatterns.length,
    })
  }

  /**
   * URL이 광고인지 확인
   *
   * @param url - 확인할 URL
   * @returns 광고이면 true
   */
  static isAdURL(url: string): boolean {
    try {
      return this.adPatterns.some((pattern) => pattern.test(url))
    } catch (error) {
      logger.error('[AdBlockService] URL check failed:', error)
      return false
    }
  }

  /**
   * 패턴 추가
   */
  static addPattern(pattern: RegExp): void {
    this.adPatterns.push(pattern)
    logger.info('[AdBlockService] Pattern added', { pattern: pattern.source })
  }

  /**
   * 패턴 초기화
   */
  static resetPatterns(): void {
    this.adPatterns = []
    this.initialize()
    logger.info('[AdBlockService] Patterns reset')
  }
}
