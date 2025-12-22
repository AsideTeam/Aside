/**
 * Types Module - 도메인 타입 및 공용 유틸 타입
 *
 * [Barrel File Pattern]
 * 책임: shared/types 모듈의 모든 export를 취합
 *
 * Main/Renderer에서 import하는 곳:
 *   import type { Maybe, Dict } from '@shared/types/common';
 *   import type { History, Bookmark } from '@shared/types/entities';
 *   import { AsideError } from '@shared/types/errors';
 *
 * 또는 Barrel 사용:
 *   import type { Maybe, History } from '@shared/types';
 *   import { AsideError } from '@shared/types';
 *
 * 철학:
 * - common.ts: 비즈니스 로직 무관 (Result<T>, Maybe<T> 등)
 * - entities.ts: DB 모델 (History, Bookmark, SessionTab 등)
 * - errors.ts: 에러 정의 (AsideError, ErrorCodes)
 */

export * from './common'
export * from './entities'
export * from './errors'
export * from './settings'
