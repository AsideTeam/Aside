import { app, BrowserWindow } from 'electron'
import path from 'path'
import { LAYOUT, COLORS } from '@shared/constants/layout'

/**
 * BrowserWindow 생성 및 설정
 */
export function createWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: LAYOUT.DEFAULT_WINDOW_WIDTH,
    height: LAYOUT.DEFAULT_WINDOW_HEIGHT,
    minWidth: LAYOUT.WINDOW_MIN_WIDTH,
    minHeight: LAYOUT.WINDOW_MIN_HEIGHT,
    backgroundColor: COLORS.FRAME_BG,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 20, y: 20 },
    webPreferences: {
      preload: path.join(__dirname, '../dist-preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  // 개발 모드 or 프로덕션 모드
  const isDev = !app.isPackaged
  const indexHtml = path.join(__dirname, '../dist-renderer/index.html')

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(indexHtml)
  }

  return mainWindow
}
