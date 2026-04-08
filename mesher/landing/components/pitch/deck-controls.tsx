/* Deck controls overlay — nav, progress, fullscreen, PDF */
'use client'

import {
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  Download,
} from 'lucide-react'
import type { SlideData } from '@/lib/pitch/deck-data'

interface DeckControlsProps {
  slides: readonly SlideData[]
  index: number
  canPrev: boolean
  canNext: boolean
  isFullscreen: boolean
  isExporting: boolean
  onPrev: () => void
  onNext: () => void
  onGoTo: (n: number) => void
  onToggleFullscreen: () => void
  onExportPdf: () => void
}

export function DeckControls({
  slides,
  index,
  canPrev,
  canNext,
  isFullscreen,
  isExporting,
  onPrev,
  onNext,
  onGoTo,
  onToggleFullscreen,
  onExportPdf,
}: DeckControlsProps) {
  return (
    <div className="absolute bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-border/80 bg-background/90 px-4 py-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-md">
      {/* Prev */}
      <button
        onClick={onPrev}
        disabled={!canPrev}
        aria-label="Previous slide"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-card hover:text-foreground disabled:opacity-30"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {/* Progress dots */}
      <div className="flex items-center gap-1.5 px-1">
        {slides.map((s, i) => (
          <button
            key={s.id}
            onClick={() => onGoTo(i)}
            aria-label={`Go to slide ${i + 1}: ${s.eyebrow}`}
            className="group relative"
          >
            <span
              className={`block h-2 rounded-full transition-all duration-200 ${
                i === index
                  ? 'w-6 bg-accent'
                  : 'w-2 bg-muted-foreground/30 group-hover:bg-muted-foreground/50'
              }`}
            />
          </button>
        ))}
      </div>

      {/* Next */}
      <button
        onClick={onNext}
        disabled={!canNext}
        aria-label="Next slide"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-card hover:text-foreground disabled:opacity-30"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      <div className="mx-1 h-5 w-px bg-border/60" />

      {/* Slide counter */}
      <span className="font-mono text-[12px] tabular-nums text-muted-foreground">
        {String(index + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
      </span>

      <div className="mx-1 h-5 w-px bg-border/60" />

      {/* Fullscreen */}
      <button
        onClick={onToggleFullscreen}
        aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
      >
        {isFullscreen ? (
          <Minimize className="h-4 w-4" />
        ) : (
          <Maximize className="h-4 w-4" />
        )}
      </button>

      {/* PDF Download */}
      <button
        onClick={onExportPdf}
        disabled={isExporting}
        aria-label="Download PDF"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-card hover:text-foreground disabled:opacity-50"
      >
        {isExporting ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        ) : (
          <Download className="h-4 w-4" />
        )}
      </button>
    </div>
  )
}
