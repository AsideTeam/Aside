/// <reference types="vite/client" />

declare global {
  interface Window {
    electronAPI: import('./electron-env').ElectronAPI
  }
}

export {}
