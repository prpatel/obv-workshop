import { onUnmounted } from 'vue'

/**
 * Deck-level auto-advance: drives Slidev's native click state one step at a
 * time, evenly spaced across a total duration, so the v-click machinery
 * (per-segment ~300ms draws, URL ?clicks sync, backward nav) stays fully
 * native. Pure Vue — the Slidev navigation boundary is injected, so tests run
 * without a live Slidev runtime.
 */

/**
 * The slice of Slidev's `useNav()` the runner needs (verified in
 * @slidev/client/composables/useNav.ts: `clicks`, `clicksTotal` computeds and
 * `next()` — advance one click, or move to the next slide at the last one).
 */
export interface AutoAdvanceNav {
  /** Current click count on the active slide. */
  clicks: () => number
  /** Total clicks configured on the active slide. */
  clicksTotal: () => number
  /** Advance the deck by one click (Slidev `nav.next()`). */
  next: () => void
}

export interface UseAutoAdvanceOptions {
  nav: AutoAdvanceNav
  /** Default run duration in ms (demo default: 7s). */
  durationMs: number
  /**
   * Optional measured click-fire times (ms from run start) — one entry per
   * click (art_7bTnqSB3 §2.3: TileGrid's stagger gaps GROW, which uniform
   * spacing cannot express). When long enough to cover the remaining clicks
   * it supersedes `durationMs` spacing (a `runMs` argument is ignored); clicks
   * beyond the schedule repeat its final interval. Runs resuming mid-schedule
   * replay the tail from their own t0 (click k fires at schedule[k]).
   */
  stepScheduleMs?: number[]
  /** Start immediately at setup (used by the `?autoplay=N` URL param). */
  autoStart?: boolean
  /** Keys that cancel a running run — manual navigation. */
  cancelKeys?: string[]
  /** Key that toggles start/stop, compared case-insensitively (default `a`). */
  toggleKey?: string
}

export interface AutoAdvanceController {
  /** Start a run over `runMs` (defaults to the configured duration). No-op if already running or at the final click. */
  start: (runMs?: number) => void
  stop: () => void
  toggle: () => void
  isRunning: () => boolean
}

/** Navigation keys that cancel a running auto-advance — Slidev's nav keys. */
export const DEFAULT_CANCEL_KEYS = ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', ' ', 'PageUp', 'PageDown'] as const

/**
 * Parse an `?autoplay=N` query string into a run duration in ms. A bare
 * (valueless) or invalid value falls back to `fallbackMs`; absence of the
 * param returns null (no auto-start).
 */
export function parseAutoplayParam(search: string, fallbackMs: number): number | null {
  const raw = new URLSearchParams(search).get('autoplay')
  if (raw === null)
    return null
  const seconds = Number.parseFloat(raw)
  return Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : fallbackMs
}

export function useAutoAdvance(options: UseAutoAdvanceOptions): AutoAdvanceController {
  const { nav } = options
  const cancelKeys = new Set<string>(options.cancelKeys ?? DEFAULT_CANCEL_KEYS)
  const toggleKey = (options.toggleKey ?? 'a').toLowerCase()

  let timer: ReturnType<typeof setTimeout> | null = null
  let remaining = 0 // advances left in the current run
  let spacingMs = 0 // exact per-step spacing: durationMs / remaining
  let scheduled = 0 // advances already scheduled in this run
  let durationMs = options.durationMs
  let delays: number[] = [] // per-step schedule for the current run (ms between consecutive advances)

  function tick(): void {
    // Drift guard: if anything else (presenter sync, another surface) brought
    // the deck to the final click, stop here — never overshoot into the next
    // slide via nav.next().
    if (nav.clicks() >= nav.clicksTotal()) {
      stop()
      return
    }
    nav.next()
    remaining -= 1
    if (remaining <= 0) {
      stop() // final click reached: stop cleanly
      return
    }
    scheduled += 1
    // Absolute-target scheduling: step k fires round(k · spacing) ms into the
    // run (uniform) or at its measured schedule entry (step-schedule runs), so
    // integer-precision timers still land each step exactly on its target.
    timer = setTimeout(tick, delays[Math.min(scheduled, delays.length - 1)])
  }

  function start(runMs?: number): void {
    if (timer !== null)
      return // double-start guard
    const left = nav.clicksTotal() - nav.clicks()
    if (left <= 0)
      return // already at the final click: nothing to play
    remaining = left
    const schedule = options.stepScheduleMs
    const head = schedule && schedule.length > 0
      ? schedule.slice(nav.clicks(), nav.clicks() + left)
      : []
    if (head.length > 0) {
      // Measured cadence: fire the remaining clicks at their schedule entries
      // (run-relative; a resumed run replays the tail from its own t0).
      delays = head.map((t, i) => (i === 0 ? t : t - head[i - 1]))
      while (delays.length < left)
        delays.push(delays[delays.length - 1]) // schedule exhausted: repeat its final interval
    }
    else {
      durationMs = runMs ?? options.durationMs
      spacingMs = durationMs / left
      // First advance lands one interval in; the last lands exactly at durationMs.
      delays = Array.from({ length: left }, (_, k) => Math.round(spacingMs * (k + 1)) - Math.round(spacingMs * k))
    }
    scheduled = 0
    timer = setTimeout(tick, delays[0])
  }

  function stop(): void {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
  }

  function toggle(): void {
    if (timer === null)
      start()
    else
      stop()
  }

  function onKeyDown(ev: KeyboardEvent): void {
    // Ignore modifier chords (Ctrl+A select-all is not a toggle).
    if (ev.ctrlKey || ev.metaKey || ev.altKey)
      return
    if (cancelKeys.has(ev.key)) {
      stop()
      return
    }
    if (ev.key.toLowerCase() === toggleKey)
      toggle()
  }

  window.addEventListener('keydown', onKeyDown)
  onUnmounted(() => {
    stop()
    window.removeEventListener('keydown', onKeyDown)
  })

  if (options.autoStart)
    start()

  return { start, stop, toggle, isRunning: () => timer !== null }
}
