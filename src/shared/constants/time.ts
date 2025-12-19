/**
 * Time Constants - 시간/타임아웃 관련 상수
 *
 * 책임: 앱 전체에서 사용하는 시간 값들을 한곳에서 관리
 * - 타임아웃 값 (네트워크, 애니메이션 등)
 * - 딜레이 값
 * - 갱신 주기 (refresh rate)
 *
 * 사용 예:
 *   import { TIMEOUTS, ANIMATION_DURATIONS } from '@shared/constants';
 *   setTimeout(() => {}, TIMEOUTS.NETWORK_REQUEST);
 */

/**
 * 타임아웃 값 (밀리초)
 *
 * 네트워크, 데이터베이스 등의 작업 완료 대기 시간
 */
export const TIMEOUTS = {
  // 네트워크 요청 타임아웃
  NETWORK_REQUEST: 10000, // 10초

  // 데이터베이스 작업 타임아웃
  DATABASE: 5000, // 5초

  // 탭 로드 타임아웃
  TAB_LOAD: 30000, // 30초

  // 일반적인 작업 타임아웃
  GENERAL: 5000, // 5초

  // 빠른 작업 (UI 업데이트 등)
  FAST: 1000, // 1초
} as const

/**
 * 애니메이션 지속 시간 (밀리초)
 *
 * CSS 트랜지션, React 애니메이션 등의 지속 시간
 */
export const ANIMATION_DURATIONS = {
  // 사이드바 펼치기/접기
  SIDEBAR_TOGGLE: 200,

  // 탭 전환
  TAB_SWITCH: 150,

  // 페이드 인/아웃
  FADE: 300,

  // 슬라이드 애니메이션
  SLIDE: 250,

  // 빠른 애니메이션 (버튼 호버 등)
  QUICK: 100,

  // 느린 애니메이션
  SLOW: 500,
} as const

/**
 * 갱신 주기 (밀리초)
 *
 * 데이터 새로고침, 상태 체크 등의 반복 간격
 */
export const REFRESH_RATES = {
  // 탭 상태 체크 (활성 여부, 로딩 상태)
  TAB_STATE: 500,

  // UI 상태 동기화
  UI_SYNC: 1000,

  // 성능 모니터링
  PERFORMANCE_CHECK: 5000,

  // 자동 저장
  AUTOSAVE: 30000, // 30초
} as const

/**
 * 캐시 유효 시간 (밀리초)
 *
 * 캐시된 데이터가 유효한 시간
 */
export const CACHE_DURATIONS = {
  // 페이지 제목/파비콘 캐시
  FAVICON: 86400000, // 1일

  // 북마크 목록 캐시
  BOOKMARKS: 3600000, // 1시간

  // 방문 기록 캐시
  HISTORY: 1800000, // 30분

  // 세션 데이터 캐시
  SESSION: 300000, // 5분
} as const

/**
 * 단위 변환
 *
 * 시간 단위를 변환할 때 사용
 */
export const TIME_UNITS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000, // 대략적
} as const
