import { useState, useEffect } from 'react'
import { TabBar } from './components/TabBar'
import { AddressBar } from './components/AddressBar'
import { ContentArea } from './components/ContentArea'
import { SettingsPage } from './pages/SettingsPage'

export function App() {
  const [currentUrl, setCurrentUrl] = useState<string>('about:blank')
  const [error, setError] = useState<string | null>(null)

  console.log('[App] Rendering with currentUrl:', currentUrl)

  // Main process에서 URL 변경 이벤트 받기
  useEffect(() => {
    try {
      // navigate-to-settings 이벤트 리스너
      const handleNavigateToSettings = () => {
        console.log('[App] Received navigate-to-settings event')
        setCurrentUrl('about:settings')
      }

      // 이벤트 리스너 등록
      if (window.electronAPI?.on) {
        window.electronAPI.on('navigate-to-settings', handleNavigateToSettings)
      } else {
        console.warn('[App] electronAPI.on not available')
      }

      return () => {
        // 이벤트 리스너 해제
        if (window.electronAPI?.off) {
          window.electronAPI.off('navigate-to-settings', handleNavigateToSettings)
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('[App] Failed to setup event listener:', message)
      setError(message)
    }
  }, [])

  const isSettingsPage = currentUrl === 'about:settings'
  console.log('[App] isSettingsPage:', isSettingsPage)

  // 에러 표시
  if (error) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        background: 'var(--bg-main)',
        color: '#ff6b6b',
        fontFamily: 'monospace',
        flexDirection: 'column',
        padding: '20px',
      }}>
        <div style={{ fontSize: '16px', fontWeight: 'bold' }}>오류 발생</div>
        <div style={{ fontSize: '12px', marginTop: '10px', maxWidth: '600px', wordBreak: 'break-all' }}>
          {error}
        </div>
      </div>
    )
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      width: '100%', 
      height: '100%',
      background: 'var(--bg-main)'
    }}>
      <TabBar />
      <AddressBar currentUrl={currentUrl} onNavigate={setCurrentUrl} />
      
      {isSettingsPage ? (
        <SettingsPage />
      ) : (
        <ContentArea />
      )}

      {/* Main process의 WebContentsView가 여기에 렌더링됨 */}
      {/* about: 페이지일 때는 이 영역이 WebView로 가려지지 않도록 하기 위해 z-index 조정 */}
    </div>
  )
}
