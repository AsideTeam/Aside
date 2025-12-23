/**
 * View Types - WebContentsView 관련 공유 타입
 *
 * 책임: Main ↔ Renderer 간 WebContentsView 통신 타입 정의
 * - ViewBounds: 뷰 위치/크기
 * - ViewNavigatePayload: 네비게이션 요청/응답
 * - LayoutConfig: 레이아웃 설정
 */

/**
 * WebContentsView의 위치와 크기
 *
 * DPI 배율이 고려된 절대값
 * - x, y: 윈도우 내 좌상단 좌표 (픽셀)
 * - width, height: 뷰 크기 (픽셀)
 * - margin: 선택사항, 배경과의 여백
 */
export interface ViewBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  margin?: number; // Arc 스타일: 배경과의 여백 (기본값: 0)
}

/**
 * WebContentsView 네비게이션 요청
 */
export interface ViewNavigatePayload {
  url: string;
  referrer?: string; // 선택사항
}

/**
 * WebContentsView 네비게이션 응답
 */
export interface ViewNavigateResponse {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * 레이아웃 모드
 *
 * - 'browser': 기존 상단 주소창 스타일 (BrowserLayout)
 * - 'zen': 좌측 사이드바 스타일 (ZenLayout)
 * - 'arc': Arc 스타일 (향후 확장)
 */
export type LayoutMode = 'browser' | 'zen' | 'arc';

/**
 * 레이아웃 설정
 */
export interface LayoutConfig {
  mode: LayoutMode;
  sidebarWidth?: number; // Zen 레이아웃에서 사이드바 너비
  isDarkMode?: boolean;
}

/**
 * 뷰 로드 이벤트
 */
export interface ViewLoadedEvent {
  url: string;
  timestamp: number;
}

/**
 * 뷰 네비게이션 이벤트
 */
export interface ViewNavigatedEvent {
  url: string;
  canGoBack: boolean;
  canGoForward: boolean;
  timestamp: number;
}
