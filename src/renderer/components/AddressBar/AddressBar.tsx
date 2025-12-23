import { useState, useEffect } from 'react'
import { ArrowLeft, ArrowRight, RotateCw, Settings } from 'lucide-react'
import { NavButton } from './NavButton'
import { UrlInput } from './UrlInput'

interface AddressBarProps {
  currentUrl: string
  onNavigate: (url: string) => void
}

export function AddressBar({ currentUrl, onNavigate }: AddressBarProps) {
  const [url, setUrl] = useState('')

  useEffect(() => {
    setUrl(currentUrl)
  }, [currentUrl])

  const handleNavigateBack = () => {
    void window.electronAPI.invoke('tab:back')
  }

  const handleNavigateForward = () => {
    void window.electronAPI.invoke('tab:forward')
  }

  const handleReload = () => {
    void window.electronAPI.invoke('tab:reload')
  }

  const handleUrlSubmit = () => {
    console.log('[AddressBar] handleUrlSubmit called with:', url)
    if (url.startsWith('about:')) {
      console.log('[AddressBar] Detected about: URL, setting currentUrl and notifying Main:', url)
      // Renderer 상태 변경
      onNavigate(url)
      // Main process에도 알려서 동기화
      void window.electronAPI.invoke('tab:navigate', { url })
    } else {
      console.log('[AddressBar] Regular URL, invoking tab:navigate with:', url)
      void window.electronAPI.invoke('tab:navigate', { url })
    }
  }

  const handleSettingsClick = () => {
    onNavigate('about:settings')
    setUrl('about:settings')
  }

  return (
    <div style={{
      height: 'var(--height-addressbar)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      background: 'var(--bg-toolbar)',
      gap: '12px',
      WebkitAppRegion: 'drag'
    } as React.CSSProperties}>
      {/* 네비게이션 버튼 (좌측) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        flexShrink: 0,
        WebkitAppRegion: 'no-drag'
      } as React.CSSProperties}>
        <NavButton 
          icon={<ArrowLeft size={18} />} 
          title="뒤로" 
          onClick={handleNavigateBack}
        />
        <NavButton 
          icon={<ArrowRight size={18} />} 
          title="앞으로" 
          onClick={handleNavigateForward}
        />
        <NavButton 
          icon={<RotateCw size={18} />} 
          title="새로고침"
          onClick={handleReload}
        />
      </div>

      {/* 주소창 (중앙) */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        WebkitAppRegion: 'no-drag'
      } as React.CSSProperties}>
        <UrlInput 
          value={url}
          onChange={setUrl}
          onSubmit={handleUrlSubmit}
        />
      </div>

      {/* 우측 버튼 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        flexShrink: 0,
        WebkitAppRegion: 'no-drag'
      } as React.CSSProperties}>
        <button
          onClick={handleSettingsClick}
          className="icon-button"
          title="설정"
        >
          <Settings size={18} />
        </button>
      </div>
    </div>
  )
}
