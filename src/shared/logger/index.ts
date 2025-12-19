/**
 * Logger Module - Shared Logger Interface & Levels
 *
 * [Barrel File Pattern]
 * 책임: shared/logger 모듈의 모든 export를 취합
 *
 * Main & Renderer 모두에서 import하는 곳:
 *   import { LogLevel, ILogger } from '@shared/logger';
 *
 * 구현 세부사항:
 * - Main: src/main/utils/logger.ts에서 ILogger 구현
 * - Renderer: src/renderer/src/lib/logger.ts에서 ILogger 구현
 * - shared에서는 인터페이스만 정의 (구현체 없음!)
 */

export * from './levels'
export * from './types'
