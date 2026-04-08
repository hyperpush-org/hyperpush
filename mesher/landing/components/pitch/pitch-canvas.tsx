/* ------------------------------------------------------------------
 *  16:9 canvas container — scales to fill the viewport
 *  Logical resolution: 1920 × 1080
 * ----------------------------------------------------------------- */
'use client'

import { useRef, useEffect, useState, type ReactNode } from 'react'

const LOGICAL_W = 1920
const LOGICAL_H = 1080

interface PitchCanvasProps {
  children: ReactNode
  className?: string
}

export function PitchCanvas({ children, className = '' }: PitchCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.5) // safe initial

  useEffect(() => {
    function resize() {
      const container = containerRef.current
      if (!container) return

      const pw = container.clientWidth
      const ph = container.clientHeight

      const sw = pw / LOGICAL_W
      const sh = ph / LOGICAL_H
      setScale(Math.min(sw, sh))
    }

    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center justify-center overflow-hidden ${className}`}
      style={{ width: '100%', height: '100dvh' }}
    >
      <div
        style={{
          width: `${LOGICAL_W}px`,
          height: `${LOGICAL_H}px`,
          minWidth: `${LOGICAL_W}px`,
          minHeight: `${LOGICAL_H}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        {children}
      </div>
    </div>
  )
}

export { LOGICAL_W, LOGICAL_H }
