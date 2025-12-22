import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './app'
import { initializeRenderer } from './lib/renderer-init'
import './styles/index.css'

const root = document.getElementById('root')
if (!root) {
  throw new Error('Root element not found')
}

/**
 * Renderer 초기화 후 React 마운트
 * 
 * 순서:
 * 1. initializeRenderer() - IPC 리스너 등록, 초기 상태 로드
 * 2. React 마운트 - UI 렌더링
 */
initializeRenderer()
  .then(() => {
    ReactDOM.createRoot(root).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    )
  })
  .catch((error) => {
    console.error('Failed to initialize renderer:', error)
    // 최소한의 에러 UI 표시
    if (root) {
      root.innerHTML = '<div style="color: red; padding: 20px;">Failed to load Aside Browser</div>'
    }
  })
