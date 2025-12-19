import { app, BrowserWindow, ipcMain } from 'electron'
import crypto from 'crypto'
import lifecycle from '@main/core/lifecycle'
import { ViewManager } from '@main/managers/view-manager'
import { createWindow } from '@main/core/window'
import { createLogger } from '@main/utils/logger'
import { setupIPCHandlers } from './handlers'

const logger = createLogger('main')

let mainWindow: BrowserWindow | null = null

/**
 * ===== LIFECYCLE: BOOTSTRAP =====
 */

app.on('ready', async () => {
  logger.info('App event: ready')

  try {
    // 1. Lifecycle Bootstrap (모든 시스템 초기화)
    await lifecycle.bootstrap()

    // 2. Window Creation
    logger.info('Creating main window...')
    mainWindow = createWindow()

    if (!mainWindow) {
      throw new Error('Failed to create main window')
    }

    mainWindow.on('ready-to-show', () => {
      mainWindow?.show()
      logger.info('Main window shown')
    })

    // 3. ViewManager Initialization
    logger.info('Initializing ViewManager...')
    ViewManager.initialize(mainWindow)
    const viewManager = ViewManager.getInstance()

    if (!viewManager) {
      throw new Error('Failed to initialize ViewManager')
    }

    // 4. Create Initial Tab
    logger.info('Creating initial tab...')
    const initialTabId = crypto.randomUUID()
    viewManager.createTab(initialTabId, 'https://www.google.com', 'Google')

    // 5. Window Resize Handler
    mainWindow.on('resize', () => {
      viewManager?.onWindowResize()
    })

    // 6. Setup IPC Handlers
    logger.info('Setting up IPC handlers...')
    setupIPCHandlers(mainWindow, viewManager)

    logger.info('✓ App ready and fully initialized')
  } catch (error) {
    logger.error('Fatal error in app ready', error)
    app.quit()
  }
})

/**
 * ===== LIFECYCLE: RUNTIME =====
 */

app.on('activate', () => {
  logger.info('App event: activate')
  if (BrowserWindow.getAllWindows().length === 0) {
    app.emit('ready')
  }
})

/**
 * ===== LIFECYCLE: SHUTDOWN =====
 */

app.on('before-quit', async (event) => {
  logger.info('App event: before-quit')
  // Shutdown 로직이 동기적으로 완료되지 않으면 프로세스가 기다리지 않음
  // 따라서 여기서는 최소한의 정리만 수행
})

app.on('will-quit', async (event) => {
  logger.info('App event: will-quit')
  event.preventDefault() // 잠깐, 정리 시간 주기
  
  ;(async () => {
    try {
      await lifecycle.shutdown()
    } catch (error) {
      logger.error('Error during shutdown', error)
    } finally {
      app.exit(0)
    }
  })()
})

app.on('window-all-closed', () => {
  logger.info('App event: window-all-closed')
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

/**
 * Handle any uncaught exceptions
 */
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', error)
  app.quit()
})
