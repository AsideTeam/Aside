/// <reference types="vite/client" />

declare global {
  interface Window {
    electronAPI: import('../preload/index').ElectronAPI
  }
}

export {}
