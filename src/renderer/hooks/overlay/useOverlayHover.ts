/**
 * useOverlayHover Hook
 *
 * Electron overlay window의 마우스 hover 감지
 *
 * 아키텍처 (Electron 공식 패턴):
 * 1. Renderer: mousemove로 hover hotzone 계산
 * 2. Renderer → Main IPC: setIgnoreMouseEvents 요청
 * 3. CSS: 트랜지션/애니메이션
 */

import { useOverlayInteraction } from './useOverlayInteraction'

export function useOverlayHover() {
  // Backward-compatible alias
  useOverlayInteraction()
}
