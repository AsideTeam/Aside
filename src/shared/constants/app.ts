/**
 * 앱 전체에서 사용하는 글로벌 상수
 */

// App Metadata
export const APP_NAME = 'Aside'
export const APP_VERSION = '0.1.0'

// Environment
export const isDev = process.env.NODE_ENV === 'development'
export const isProd = process.env.NODE_ENV === 'production'

// Paths (렌더러에서는 사용하지 말 것 - Main Process 전용)
export const PRELOAD_PATH = '../out/preload/index.cjs'
export const RENDERER_DIST = '../out/renderer'
