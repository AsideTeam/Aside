/**
 * ContentArea - 웹 콘텐츠 표시 영역
 *
 * 책임:
 * - Main process의 WebContentsView가 표시될 영역 (id="content-area")
 * - JavaScript DOM 조작은 하지 않음 (Electron이 네이티브로 삽입)
 *
 * 주의: 이 div는 Renderer 프로세스의 React 엘리먼트이지만,
 *       실제 콘텐츠는 Main process가 WebContentsView로 렌더링합니다.
 *
 * 구조:
 * - position: relative로 설정하여 Main의 WebView가 여기를 기준으로 렌더링됨
 * - z-index를 사용하지 않음 (native render는 CSS z-index의 영향을 받지 않음)
 */

export function ContentArea() {
  console.log('[ContentArea] Rendering WebView container')
  
  return (
    <div 
      id="content-area"
      style={{
        flex: 1,
        background: 'var(--bg-main)',
        position: 'relative',
        overflow: 'hidden',
        // Main process의 WebContentsView가 여기에 렌더링됨
        // z-index 없음: native content는 DOM z-index의 영향을 받지 않음
      }}
    >
      {/* WebContentsView가 여기에 네이티브로 렌더링됨 */}
    </div>
  )
}
