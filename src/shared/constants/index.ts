/**
 * Constants Module - 앱 전체 상수 모음
 *
 * [Barrel File Pattern]
 * 책임: shared/constants 모듈의 모든 export를 취합
 *
 * Main/Renderer에서 import하는 곳:
 *   import { APP_NAME, LAYOUT, TIMEOUTS } from '@shared/constants';
 */

export * from './app'
export * from './layout'
export * from './time'
