/**
 * Database Connection Retry Logic (Exponential Backoff)
 *
 * 책임: Prisma 연결 실패 시 자동 재시도
 * - Exponential backoff (1s → 2s → 4s → 8s)
 * - 최대 재시도 횟수 제한
 * - 연결 풀 관리
 *
 * 사용 예:
 *   const client = await connectWithRetry()
 *   await disconnectWithCleanup()
 */

import { PrismaClient } from '@prisma/client'
import { logger } from '@main/utils/Logger'

/**
 * 재시도 설정
 */
const RETRY_CONFIG = {
  maxAttempts: 5,
  initialDelayMs: 1000,
  maxDelayMs: 8000,
  backoffMultiplier: 2,
}

/**
 * Prisma 클라이언트 싱글톤
 */
let prismaInstance: PrismaClient | null = null
let isConnecting = false
let connectionAttempt = 0

/**
 * Exponential Backoff 계산
 *
 * @param attempt - 현재 재시도 횟수
 * @returns 대기 시간 (ms)
 */
function calculateBackoffDelay(attempt: number): number {
  const delay =
    RETRY_CONFIG.initialDelayMs * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt - 1)
  return Math.min(delay, RETRY_CONFIG.maxDelayMs)
}

/**
 * 재시도 대기 함수
 *
 * @param delayMs - 대기 시간
 */
function delay(delayMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delayMs))
}

/**
 * Prisma 연결 (재시도 로직 포함)
 *
 * 프로세스:
 * 1. 기존 연결 있으면 반환
 * 2. 연결 중이면 대기
 * 3. 새 연결 시도
 * 4. 실패하면 지수 백오프로 재시도
 *
 * @returns Prisma 클라이언트
 * @throws 최대 재시도 횟수 초과 시 에러
 */
export async function connectWithRetry(): Promise<PrismaClient> {
  // ✅ 이미 연결됨
  if (prismaInstance) {
    logger.info('[Database] Using existing connection')
    return prismaInstance
  }

  // ✅ 연결 중이면 대기
  if (isConnecting) {
    logger.warn('[Database] Connection in progress, waiting...')
    let attempts = 0
    while (isConnecting && attempts < 30) {
      await delay(100)
      attempts++
    }
    if (prismaInstance) return prismaInstance
  }

  isConnecting = true
  connectionAttempt = 0

  try {
    while (connectionAttempt < RETRY_CONFIG.maxAttempts) {
      connectionAttempt++

      try {
        logger.info('[Database] Connection attempt', {
          attempt: connectionAttempt,
          maxAttempts: RETRY_CONFIG.maxAttempts,
        })

        // Step 1: Prisma 인스턴스 생성
        prismaInstance = new PrismaClient({
          log: ['warn', 'error'],
        })

        // Step 2: 연결 테스트 (ping)
        await prismaInstance.$queryRaw`SELECT 1`

        logger.info('[Database] Connection successful')
        return prismaInstance
      } catch (error) {
        logger.error('[Database] Connection failed', error)

        // 인스턴스 정리
        if (prismaInstance) {
          await prismaInstance.$disconnect().catch(() => {})
          prismaInstance = null
        }

        // ✅ 마지막 시도는 재시도하지 않음
        if (connectionAttempt >= RETRY_CONFIG.maxAttempts) {
          throw new Error(
            `[Database] Failed to connect after ${connectionAttempt} attempts`
          )
        }

        // ✅ Exponential backoff
        const backoffDelay = calculateBackoffDelay(connectionAttempt)
        logger.info('[Database] Retrying', {
          attempt: connectionAttempt,
          delayMs: backoffDelay,
        })
        await delay(backoffDelay)
      }
    }

    throw new Error('[Database] Connection exhausted all retries')
  } finally {
    isConnecting = false
  }
}

/**
 * Prisma 연결 종료 (정리 포함)
 *
 * 호출 시점:
 * - 앱 종료 (AppLifecycle.shutdown)
 * - 에러 발생 시
 */
export async function disconnectWithCleanup(): Promise<void> {
  try {
    if (prismaInstance) {
      logger.info('[Database] Disconnecting...')

      // ✅ 연결 풀 정리
      await prismaInstance.$disconnect()

      prismaInstance = null
      connectionAttempt = 0

      logger.info('[Database] Disconnected')
    }
  } catch (error) {
    logger.error('[Database] Disconnect failed:', error)
    prismaInstance = null
  }
}

/**
 * Prisma 클라이언트 반환 (null-safe)
 *
 * @returns Prisma 클라이언트 또는 null
 */
export function getPrismaClient(): PrismaClient | null {
  return prismaInstance
}

/**
 * 연결 상태 조회
 *
 * @returns { connected, attempt, isConnecting }
 */
export function getConnectionStatus(): {
  connected: boolean
  attempt: number
  isConnecting: boolean
} {
  return {
    connected: prismaInstance !== null,
    attempt: connectionAttempt,
    isConnecting,
  }
}
