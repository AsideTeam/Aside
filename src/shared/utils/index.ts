/**
 * Utils Module - 공용 유틸리티 함수 모음
 *
 * [Barrel File Pattern]
 * 책임: shared/utils 모듈의 모든 export를 취합
 *
 * Main/Renderer에서 import하는 곳:
 *   import { formatDate, generateId, isValidUrl } from '@shared/utils';
 *
 * 철학:
 * - date-formatter.ts: 날짜 포맷팅만
 * - id-generator.ts: ID 생성만
 * - url-validator.ts: URL 검증/정규화만
 * - 파일 하나당 기능 하나 (SRP)
 *
 * [주의사항]
 * - 비즈니스 로직은 여기에 없음
 * - DB 관련 기능도 여기에 없음 (services에서 담당)
 * - 순수 함수만 존재 (side effect 없음)
 */

export * from './date-formatter'
export * from './id-generator'
export * from './url-validator'
