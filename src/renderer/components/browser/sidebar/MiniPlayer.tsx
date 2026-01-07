/**
 * MiniPlayer Component
 *
 * 하단에 고정된 미디어 플레이어 (Arc 브라우저 스타일)
 */

import React from 'react'
import { cn } from '@renderer/styles'
import { Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-react'

interface MiniPlayerProps {
  isVisible?: boolean
  isPlaying?: boolean
  title?: string
  artist?: string
  thumbnail?: string
  onPlayPause?: () => void
  onPrevious?: () => void
  onNext?: () => void
  onVolumeClick?: () => void
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({
  isVisible = false,
  isPlaying = false,
  title = '곡 제목',
  artist = '아티스트',
  thumbnail,
  onPlayPause,
  onPrevious,
  onNext,
  onVolumeClick,
}) => {
  if (!isVisible) return null

  return (
    <div className={cn(
      'w-full px-3 py-3 rounded-lg',
      'bg-(--color-bg-secondary) hover:bg-(--color-bg-tertiary)',
      'border border-(--color-border-light)',
      'flex items-center justify-between gap-3',
      'transition-all duration-200'
    )}>
      {/* Left: Thumbnail */}
      <div className="w-10 h-10 rounded-md bg-(--color-bg-tertiary) shrink-0 overflow-hidden flex items-center justify-center">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-(--color-bg-hover)" />
        )}
      </div>

      {/* Center: Info + Controls */}
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-medium text-(--color-text-primary) truncate">
          {title}
        </div>
        <div className="text-[11px] text-(--color-text-secondary) truncate">
          {artist}
        </div>
      </div>

      {/* Right: Media Controls */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onPrevious}
          className={cn(
            'p-1.5 rounded-md',
            'text-(--color-text-secondary) hover:text-(--color-text-primary)',
            'hover:bg-(--color-bg-hover)',
            'transition-colors'
          )}
          title="Previous"
        >
          <SkipBack size={14} />
        </button>

        <button
          onClick={onPlayPause}
          className={cn(
            'p-1.5 rounded-md',
            'text-(--color-text-secondary) hover:text-(--color-text-primary)',
            'hover:bg-(--color-bg-hover)',
            'transition-colors'
          )}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
        </button>

        <button
          onClick={onNext}
          className={cn(
            'p-1.5 rounded-md',
            'text-(--color-text-secondary) hover:text-(--color-text-primary)',
            'hover:bg-(--color-bg-hover)',
            'transition-colors'
          )}
          title="Next"
        >
          <SkipForward size={14} />
        </button>

        <button
          onClick={onVolumeClick}
          className={cn(
            'p-1.5 rounded-md',
            'text-(--color-text-secondary) hover:text-(--color-text-primary)',
            'hover:bg-(--color-bg-hover)',
            'transition-colors'
          )}
          title="Volume"
        >
          <Volume2 size={14} />
        </button>
      </div>
    </div>
  )
}
