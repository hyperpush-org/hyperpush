# Pitch Deck Rebuild Plan

## What's wrong with the current deck

The current `/pitch` is a scrollable web page with vertically stacked cards, a sticky sidebar, and intersection-observer-based navigation. It doesn't look or feel like a pitch deck — it looks like a long-form article with card UI. No 16:9 canvas, no slide transitions, no fullscreen mode. The "export as PDF" is just `window.print()`. The content is meta-commentary about the pitch itself ("Why the opening works", "Evaluator lens", "Buyer readout") rather than actual pitch content.

## Architecture

### Files to delete (complete wipe)

- `mesher/landing/components/pitch/pitch-deck.tsx`
- `mesher/landing/components/pitch/pitch-slide.tsx`
- `mesher/landing/components/pitch/pitch-slide-variants.tsx`
- `mesher/landing/components/pitch/pitch-controls.tsx`
- `mesher/landing/components/pitch/pitch-export-button.tsx`
- `mesher/landing/components/pitch/use-pitch-navigation.ts`
- `mesher/landing/lib/pitch/slides.ts`
- `mesher/landing/tests/pitch-route.spec.ts`

### Files to rewrite

- `mesher/landing/app/pitch/page.tsx`
- `mesher/landing/app/pitch/layout.tsx`

### New files to create

| File | Purpose |
|---|---|
| `lib/pitch/deck-data.ts` | Slide content data — clean types + actual investor-grade pitch copy |
| `components/pitch/pitch-deck.tsx` | Main deck shell — 16:9 canvas, controls overlay, keyboard/touch nav |
| `components/pitch/pitch-canvas.tsx` | The 16:9 aspect-ratio container with CSS scaling to fill viewport |
| `components/pitch/pitch-slide.tsx` | Individual slide renderer — dispatches to variant layouts |
| `components/pitch/slides/title-slide.tsx` | Title/cover slide layout |
| `components/pitch/slides/problem-slide.tsx` | Problem statement layout |
| `components/pitch/slides/solution-slide.tsx` | Solution layout |
| `components/pitch/slides/product-slide.tsx` | Product demo/screenshot layout |
| `components/pitch/slides/market-slide.tsx` | Market size layout |
| `components/pitch/slides/business-model-slide.tsx` | Business model layout |
| `components/pitch/slides/traction-slide.tsx` | Traction/metrics layout |
| `components/pitch/slides/team-slide.tsx` | Team layout |
| `components/pitch/slides/ask-slide.tsx` | The ask / CTA layout |
| `components/pitch/slides/technology-slide.tsx` | Technology moat layout (Mesh) |
| `components/pitch/deck-controls.tsx` | Floating control bar: prev/next, slide counter, fullscreen, PDF download, progress dots |
| `components/pitch/use-deck-navigation.ts` | Hook: keyboard (←→, space, escape), slide state, fullscreen API |
| `components/pitch/use-deck-pdf.ts` | Hook: html2canvas + jsPDF export at 16:9 |
| `components/pitch/slide-transition.tsx` | Framer Motion AnimatePresence wrapper for slide enter/exit |
| `tests/pitch-route.spec.ts` | New Playwright tests for the rebuilt deck |

All paths above are relative to `mesher/landing/`.

## Slide Content (Industry-standard pitch deck structure)

10 slides, following the proven Sequoia/YC format:

1. **Title** — Company name, tagline, one-line value prop
2. **Problem** — The pain point (expensive, brittle error tracking; bug backlogs rot)
3. **Solution** — hyperpush: open-source error tracking + token-funded bug fixes
4. **Product** — Screenshot/visual of the actual product workflow
5. **Technology Moat** — Mesh runtime: actor isolation, cluster failover, compiled performance
6. **Market** — TAM/SAM/SOM for error tracking + developer tools
7. **Business Model** — Self-hosted free, Pro $29/mo, Pro+ $100/mo, token economics flywheel
8. **Traction** — Public repo, deployable examples, early signals
9. **Team** — Who's building this and why they can ship it
10. **The Ask** — What you want, what it funds, CTA links

## Canvas & Presentation Behavior

- **16:9 fixed aspect ratio** canvas (1920×1080 logical) that CSS-scales to fill the viewport
- **One slide visible at a time** — no scrolling between slides
- **Framer Motion transitions** between slides (horizontal slide with fade, ~400ms spring)
- **Within-slide animations**: staggered content entrance (heading → subheading → bullets → metrics), subtle floating/parallax on decorative elements
- **Controls overlay** (bottom of canvas, semi-transparent):
  - Previous / Next buttons
  - Slide counter with progress dots
  - Fullscreen toggle (Fullscreen API)
  - Download PDF button
  - Slide thumbnail navigator (click to jump)
- **Keyboard**: ← → arrows, Space/Enter for next, Escape exits fullscreen
- **Touch**: swipe left/right on mobile

## PDF Export

- Use `html2canvas` + `jsPDF` (new dependencies to install)
- Render each slide at 1920×1080 to canvas, add as image to PDF
- Landscape A4/Letter, one slide per page
- Progress indicator during export

## Visual Design (matching the website theme)

- Dark background: `oklch(0.08 0 0)` (the `--background` var)
- Green accent: `oklch(0.75 0.18 160)` (the `--accent` var)
- Geist / Geist Mono fonts
- Subtle grid background pattern (matching hero section)
- Gradient orbs as slide decorations
- Card-style containers with `border-border/80`, `bg-card/70`, rounded-2xl
- Mono uppercase tracking labels (the site's signature style)
- Clean, generous whitespace — no cramming

## New Dependencies

```
npm install html2canvas jspdf
```

## What stays

- The promo images in `/public` (pricing comparison, flywheel, performance dashboard, roadmap banner) — reused in relevant slides
- External link constants from `lib/external-links.ts`
- `WaitlistButton` component
- The `Header` and `Footer` components (shown only outside fullscreen mode)

## Execution order

1. Install new deps
2. Delete old pitch files
3. Build data layer (`deck-data.ts`)
4. Build canvas/scaling infrastructure (`pitch-canvas.tsx`, `slide-transition.tsx`)
5. Build navigation hook (`use-deck-navigation.ts`)
6. Build each slide variant component (title through ask)
7. Build slide dispatcher (`pitch-slide.tsx`)
8. Build controls overlay (`deck-controls.tsx`)
9. Build PDF export hook (`use-deck-pdf.ts`)
10. Assemble main deck (`pitch-deck.tsx`)
11. Wire up page route (`page.tsx`, `layout.tsx`)
12. Write new Playwright tests
13. Verify in browser
