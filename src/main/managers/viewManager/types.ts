import type { WebContentsView } from 'electron'
import type { ILogger } from '@shared/logger'

export interface TabData {
  id: string
  view: WebContentsView
  url: string
  title: string
  isActive: boolean
  isPinned: boolean
  isFavorite: boolean
  favicon?: string
}

export type TabSection = 'icon' | 'space' | 'tab'

export type Bounds = { x: number; y: number; width: number; height: number }

export type LoggerLike = Pick<ILogger, 'debug' | 'info' | 'warn' | 'error'>
