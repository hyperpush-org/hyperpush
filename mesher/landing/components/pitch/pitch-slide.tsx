/* Slide dispatcher — routes to the correct layout variant */
'use client'

import type { SlideData } from '@/lib/pitch/deck-data'
import { TitleSlide } from './slides/title-slide'
import { ProblemSlide } from './slides/problem-slide'
import { SolutionSlide } from './slides/solution-slide'
import { ProductSlide } from './slides/product-slide'
import { TechnologySlide } from './slides/technology-slide'
import { MarketSlide } from './slides/market-slide'
import { BusinessModelSlide } from './slides/business-model-slide'
import { TractionSlide } from './slides/traction-slide'
import { TeamSlide } from './slides/team-slide'
import { AskSlide } from './slides/ask-slide'

const layoutMap: Record<string, React.ComponentType<{ slide: SlideData }>> = {
  title: TitleSlide,
  problem: ProblemSlide,
  solution: SolutionSlide,
  product: ProductSlide,
  technology: TechnologySlide,
  market: MarketSlide,
  'business-model': BusinessModelSlide,
  traction: TractionSlide,
  team: TeamSlide,
  ask: AskSlide,
}

export function PitchSlide({ slide }: { slide: SlideData }) {
  const Component = layoutMap[slide.layout]
  if (!Component) {
    return (
      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
        Unknown slide layout: {slide.layout}
      </div>
    )
  }
  return <Component slide={slide} />
}
