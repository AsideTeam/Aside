import React from 'react'

/**
 * 타이틀바 (커스텀 OS 윈도우 제어)
 * 
 * macOS: 신호등 버튼 (Red-Yellow-Green)
 * Windows: 최소화-최대화-닫기 버튼
 * 
 * 역할: 윈도우 최소화/최대화/닫기
 */
export function TitleBar() {
  const [isMaximized, setIsMaximized] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)

  const handleMinimize = async () => {
    setIsLoading(true)
    try {
      await window.electronAPI?.window?.minimize?.()
    } catch (error) {
      console.error('Failed to minimize:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleMaximize = async () => {
    setIsLoading(true)
    try {
      await window.electronAPI?.window?.maximize?.()
      setIsMaximized(!isMaximized)
    } catch (error) {
      console.error('Failed to maximize:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = async () => {
    setIsLoading(true)
    try {
      await window.electronAPI?.window?.close?.()
    } catch (error) {
      console.error('Failed to close:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="title-bar bg-gray-900 h-15 flex items-center justify-between px-4 border-b border-gray-800 select-none drag">
      {/* 브랜드 로고 */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-blue-500 rounded-lg" />
        <span className="text-sm font-medium text-white">Aside Browser</span>
      </div>

      {/* 윈도우 제어 버튼 */}
      <div className="flex items-center gap-2 ml-auto no-drag">
        <button
          onClick={handleMinimize}
          disabled={isLoading}
          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
          title="Minimize"
        >
          <span className="text-lg">−</span>
        </button>

        <button
          onClick={handleMaximize}
          disabled={isLoading}
          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
          title={isMaximized ? 'Restore' : 'Maximize'}
        >
          <span className="text-lg">{isMaximized ? '❐' : '□'}</span>
        </button>

        <button
          onClick={handleClose}
          disabled={isLoading}
          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
          title="Close"
        >
          <span className="text-lg">×</span>
        </button>
      </div>
    </div>
  )
}
