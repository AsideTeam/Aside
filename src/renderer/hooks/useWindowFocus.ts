import { useOverlayStore, selectOverlayFocus } from '@renderer/lib/overlayStore'

/**
 * Main -> Renderer로 전달되는 "창 포커스" 상태.
 * 상태는 overlayStore가 단일 소스로 관리한다.
 */
export function useWindowFocus(): boolean {
  return useOverlayStore(selectOverlayFocus)
}
