import { Plus } from 'lucide-react'
import { Tab } from './Tab'

export function TabBar() {
  // TODO: 실제 탭 상태는 store에서 관리
  const tabs = [
    { id: '1', title: 'New Tab', active: true },
  ]

  const handleTabClick = (id: string) => {
    void window.electronAPI.invoke('tab:switch', { tabId: id })
  }

  const handleTabClose = (id: string) => {
    void window.electronAPI.invoke('tab:close', { tabId: id })
  }

  const handleNewTab = () => {
    void window.electronAPI.invoke('tab:create', { url: 'https://www.google.com' })
  }

  return (
    <div style={{
      height: 'var(--height-tab)',
      display: 'flex',
      alignItems: 'flex-end',
      background: 'var(--bg-main)',
      padding: '8px 12px 0',
      WebkitAppRegion: 'drag'
    } as React.CSSProperties}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        height: '100%',
        overflowX: 'auto',
        gap: '4px',
        WebkitAppRegion: 'no-drag'
      } as React.CSSProperties} className="scrollbar-hide">
        {tabs.map((tab) => (
          <Tab
            key={tab.id}
            id={tab.id}
            title={tab.title}
            active={tab.active}
            onClick={() => handleTabClick(tab.id)}
            onClose={() => handleTabClose(tab.id)}
          />
        ))}
        
        {/* 새 탭 버튼 */}
        <button
          onClick={handleNewTab}
          style={{
            marginLeft: '8px',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--icon-default)',
            borderRadius: '50%',
            transition: 'all var(--transition-fast)',
            flexShrink: 0
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--icon-hover)'
            e.currentTarget.style.background = 'var(--bg-toolbar)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--icon-default)'
            e.currentTarget.style.background = 'transparent'
          }}
          title="새 탭"
        >
          <Plus size={20} />
        </button>
      </div>
    </div>
  )
}
